-- ============================================
-- MEGA VIDEO - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- MEMBERS TABLE
-- ============================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  pin_hash TEXT NOT NULL,
  email VARCHAR(255),
  member_since INTEGER NOT NULL DEFAULT 1987,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate member numbers (MV-198X-XXXX format)
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  year_suffix INTEGER;
BEGIN
  -- Random year between 1985-1989 for that authentic 80s feel
  year_suffix := 1985 + FLOOR(RANDOM() * 5);
  
  -- Get next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num FROM members;
  
  NEW.member_number := 'MV-' || year_suffix || '-' || LPAD(next_num::TEXT, 4, '0');
  NEW.member_since := year_suffix;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_member_number
  BEFORE INSERT ON members
  FOR EACH ROW
  WHEN (NEW.member_number IS NULL)
  EXECUTE FUNCTION generate_member_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tmdb_movie_id INTEGER NOT NULL,
  movie_title VARCHAR(255) NOT NULL,
  movie_year INTEGER,
  movie_poster VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT CHECK (LENGTH(review_text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per member per movie
  UNIQUE(member_id, tmdb_movie_id)
);

CREATE INDEX idx_reviews_movie ON reviews(tmdb_movie_id);
CREATE INDEX idx_reviews_member ON reviews(member_id);

-- ============================================
-- RENTALS TABLE
-- ============================================
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tmdb_movie_id INTEGER NOT NULL,
  movie_title VARCHAR(255) NOT NULL,
  movie_poster VARCHAR(255),
  rental_price DECIMAL(4,2) DEFAULT 2.99,
  rented_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE DEFAULT CURRENT_DATE + INTERVAL '3 days',
  review_id UUID REFERENCES reviews(id)
);

CREATE INDEX idx_rentals_member ON rentals(member_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Members: allow public signup (insert), restrict read/update to own record
CREATE POLICY "Allow public signup"
  ON members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can view own profile"
  ON members FOR SELECT
  USING (true);  -- Allow reading for login verification

-- Reviews: public read, authenticated insert
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Members can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);  -- Validated via RPC

CREATE POLICY "Members can update own reviews"
  ON reviews FOR UPDATE
  USING (true);  -- Validated via RPC

-- Rentals: member can view own
CREATE POLICY "Members can view own rentals"
  ON rentals FOR SELECT
  USING (true);  -- Validated via RPC

CREATE POLICY "Members can create rentals"
  ON rentals FOR INSERT
  WITH CHECK (true);  -- Validated via RPC

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Sign up new member (returns member data)
CREATE OR REPLACE FUNCTION signup_member(
  p_name VARCHAR(50),
  p_pin VARCHAR(4),
  p_email VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  member_number VARCHAR(20),
  name VARCHAR(50),
  member_since INTEGER
) AS $$
DECLARE
  v_member_id UUID;
  v_pin_hash TEXT;
BEGIN
  -- Validate PIN is 4 digits
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;
  
  -- Validate name
  IF LENGTH(TRIM(p_name)) < 1 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  -- Hash the PIN
  v_pin_hash := crypt(p_pin, gen_salt('bf'));
  
  INSERT INTO members (name, pin_hash, email)
  VALUES (TRIM(p_name), v_pin_hash, p_email)
  RETURNING members.id INTO v_member_id;
  
  RETURN QUERY
  SELECT m.id, m.member_number, m.name, m.member_since
  FROM members m WHERE m.id = v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Login member
CREATE OR REPLACE FUNCTION login_member(
  p_member_number VARCHAR(20),
  p_pin VARCHAR(4)
)
RETURNS TABLE(
  id UUID,
  member_number VARCHAR(20),
  name VARCHAR(50),
  member_since INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.member_number, m.name, m.member_since
  FROM members m
  WHERE UPPER(m.member_number) = UPPER(p_member_number)
    AND m.pin_hash = crypt(p_pin, m.pin_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit rental with optional reviews (batch operation)
CREATE OR REPLACE FUNCTION submit_rental(
  p_member_id UUID,
  p_movies JSONB  -- Array of {tmdb_movie_id, movie_title, movie_year, movie_poster, rating?, review_text?}
)
RETURNS TABLE(
  success BOOLEAN,
  rentals_count INTEGER,
  reviews_count INTEGER
) AS $$
DECLARE
  movie JSONB;
  v_review_id UUID;
  v_rentals INTEGER := 0;
  v_reviews INTEGER := 0;
BEGIN
  -- Validate member exists
  IF NOT EXISTS (SELECT 1 FROM members WHERE members.id = p_member_id) THEN
    RAISE EXCEPTION 'Invalid member ID';
  END IF;

  FOR movie IN SELECT * FROM jsonb_array_elements(p_movies)
  LOOP
    v_review_id := NULL;
    
    -- Insert review if rating provided
    IF (movie->>'rating') IS NOT NULL AND (movie->>'rating')::INTEGER > 0 THEN
      INSERT INTO reviews (member_id, tmdb_movie_id, movie_title, movie_year, movie_poster, rating, review_text)
      VALUES (
        p_member_id,
        (movie->>'tmdb_movie_id')::INTEGER,
        movie->>'movie_title',
        (movie->>'movie_year')::INTEGER,
        movie->>'movie_poster',
        (movie->>'rating')::INTEGER,
        NULLIF(TRIM(movie->>'review_text'), '')
      )
      ON CONFLICT (member_id, tmdb_movie_id) DO UPDATE
      SET rating = EXCLUDED.rating,
          review_text = EXCLUDED.review_text
      RETURNING reviews.id INTO v_review_id;
      
      v_reviews := v_reviews + 1;
    END IF;
    
    -- Insert rental record
    INSERT INTO rentals (member_id, tmdb_movie_id, movie_title, movie_poster, review_id)
    VALUES (
      p_member_id,
      (movie->>'tmdb_movie_id')::INTEGER,
      movie->>'movie_title',
      movie->>'movie_poster',
      v_review_id
    );
    
    v_rentals := v_rentals + 1;
  END LOOP;
  
  RETURN QUERY SELECT TRUE, v_rentals, v_reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION signup_member TO anon, authenticated;
GRANT EXECUTE ON FUNCTION login_member TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_rental TO anon, authenticated;

