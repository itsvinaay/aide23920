/*
  # Trainer-Specific Schema Enhancement

  1. New Tables
    - `workout_templates` - Reusable workout templates created by trainers
    - `workout_plans` - Structured workout plans assigned to clients
    - `exercises` - Exercise database with detailed information
    - `workout_sessions` - Individual workout sessions (enhanced)
    - `training_sessions` - Scheduled training appointments
    - `client_progress` - Track client progress over time
    - `trainer_certifications` - Trainer qualifications and certifications
    - `session_feedback` - Post-session feedback and notes
    - `client_measurements` - Body measurements and fitness metrics
    - `workout_logs` - Detailed workout execution logs
    - `exercise_variations` - Alternative versions of exercises
    - `training_programs` - Long-term training programs
    - `session_attendance` - Track session attendance and cancellations

  2. Enhanced Features
    - Comprehensive exercise library with variations
    - Template and plan management system
    - Progress tracking and analytics
    - Session scheduling and management
    - Client measurement tracking
    - Feedback and communication system

  3. Security
    - Enable RLS on all tables
    - Add policies for trainer-client relationships
    - Secure data access based on assignments
*/

-- Create exercises table (enhanced)
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  muscle_groups text[] NOT NULL,
  equipment text,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  instructions text,
  form_tips text,
  safety_notes text,
  video_url text,
  image_url text,
  created_by uuid REFERENCES profiles(id),
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercise variations table
CREATE TABLE IF NOT EXISTS exercise_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  difficulty_modifier text CHECK (difficulty_modifier IN ('easier', 'harder', 'different')),
  equipment_changes text,
  form_modifications text,
  created_at timestamptz DEFAULT now()
);

-- Create workout templates table
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_duration_minutes integer DEFAULT 60,
  equipment_needed text[],
  target_muscle_groups text[],
  workout_type text CHECK (workout_type IN ('strength', 'cardio', 'hiit', 'flexibility', 'mixed')) DEFAULT 'strength',
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template exercises junction table
CREATE TABLE IF NOT EXISTS template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  sets_config jsonb NOT NULL DEFAULT '[]', -- Array of set configurations
  rest_time_seconds integer DEFAULT 60,
  notes text,
  superset_group integer, -- For grouping exercises in supersets
  created_at timestamptz DEFAULT now()
);

-- Create workout plans table (enhanced)
CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  plan_type text CHECK (plan_type IN ('weekly', 'monthly', 'custom')) DEFAULT 'weekly',
  schedule_config jsonb NOT NULL DEFAULT '{}', -- Flexible schedule configuration
  goals text[],
  difficulty_progression text CHECK (difficulty_progression IN ('maintain', 'increase', 'decrease')) DEFAULT 'maintain',
  status text CHECK (status IN ('draft', 'active', 'completed', 'paused', 'cancelled')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create plan templates junction table
CREATE TABLE IF NOT EXISTS plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES workout_plans(id) ON DELETE CASCADE,
  template_id uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  week_number integer, -- For monthly plans
  scheduled_date date, -- For custom plans
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enhanced workout sessions table (update existing)
DO $$
BEGIN
  -- Add new columns to existing workout_sessions table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'plan_id') THEN
    ALTER TABLE workout_sessions ADD COLUMN plan_id uuid REFERENCES workout_plans(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'template_id') THEN
    ALTER TABLE workout_sessions ADD COLUMN template_id uuid REFERENCES workout_templates(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'session_type') THEN
    ALTER TABLE workout_sessions ADD COLUMN session_type text CHECK (session_type IN ('planned', 'custom', 'makeup')) DEFAULT 'planned';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'difficulty_rating') THEN
    ALTER TABLE workout_sessions ADD COLUMN difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'energy_level') THEN
    ALTER TABLE workout_sessions ADD COLUMN energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'location') THEN
    ALTER TABLE workout_sessions ADD COLUMN location text;
  END IF;
END $$;

-- Create workout logs table (detailed exercise execution)
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  sets_performed jsonb NOT NULL DEFAULT '[]', -- Actual sets performed
  total_volume_kg decimal(10,2), -- Total weight lifted
  total_reps integer,
  total_time_seconds integer,
  rest_time_seconds integer,
  notes text,
  form_rating integer CHECK (form_rating >= 1 AND form_rating <= 5), -- Trainer assessment
  completed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create training sessions table (enhanced)
DO $$
BEGIN
  -- Add new columns to existing training_sessions table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'session_focus') THEN
    ALTER TABLE training_sessions ADD COLUMN session_focus text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'preparation_notes') THEN
    ALTER TABLE training_sessions ADD COLUMN preparation_notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'equipment_needed') THEN
    ALTER TABLE training_sessions ADD COLUMN equipment_needed text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'session_price') THEN
    ALTER TABLE training_sessions ADD COLUMN session_price decimal(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'recurring_session_id') THEN
    ALTER TABLE training_sessions ADD COLUMN recurring_session_id uuid;
  END IF;
END $$;

-- Create session feedback table
CREATE TABLE IF NOT EXISTS session_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_notes text,
  client_feedback text,
  session_rating integer CHECK (session_rating >= 1 AND session_rating <= 5),
  client_energy_level integer CHECK (client_energy_level >= 1 AND session_rating <= 10),
  client_motivation_level integer CHECK (client_motivation_level >= 1 AND client_motivation_level <= 10),
  areas_of_improvement text[],
  achievements text[],
  next_session_focus text[],
  homework_assigned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client measurements table
CREATE TABLE IF NOT EXISTS client_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  measured_by uuid REFERENCES profiles(id),
  measurement_date date DEFAULT CURRENT_DATE,
  weight_kg decimal(5,2),
  height_cm decimal(5,1),
  body_fat_percentage decimal(4,1),
  muscle_mass_kg decimal(5,2),
  -- Body measurements in cm
  chest_cm decimal(5,1),
  waist_cm decimal(5,1),
  hips_cm decimal(5,1),
  bicep_left_cm decimal(4,1),
  bicep_right_cm decimal(4,1),
  thigh_left_cm decimal(4,1),
  thigh_right_cm decimal(4,1),
  forearm_left_cm decimal(4,1),
  forearm_right_cm decimal(4,1),
  neck_cm decimal(4,1),
  shoulders_cm decimal(5,1),
  -- Additional metrics
  resting_heart_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  notes text,
  photos jsonb, -- Store photo URLs/metadata
  created_at timestamptz DEFAULT now()
);

-- Create client progress table
CREATE TABLE IF NOT EXISTS client_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_date date DEFAULT CURRENT_DATE,
  assessment_type text CHECK (assessment_type IN ('initial', 'monthly', 'quarterly', 'final')) DEFAULT 'monthly',
  -- Fitness assessments
  cardio_endurance_score integer CHECK (cardio_endurance_score >= 1 AND cardio_endurance_score <= 100),
  strength_score integer CHECK (strength_score >= 1 AND strength_score <= 100),
  flexibility_score integer CHECK (flexibility_score >= 1 AND flexibility_score <= 100),
  balance_score integer CHECK (balance_score >= 1 AND balance_score <= 100),
  -- Performance metrics
  max_bench_press_kg decimal(5,2),
  max_squat_kg decimal(5,2),
  max_deadlift_kg decimal(5,2),
  mile_run_time_seconds integer,
  plank_hold_seconds integer,
  -- Goals progress
  primary_goal text,
  goal_progress_percentage integer CHECK (goal_progress_percentage >= 0 AND goal_progress_percentage <= 100),
  goals_achieved text[],
  challenges_faced text[],
  trainer_observations text,
  client_self_assessment text,
  next_phase_recommendations text,
  created_at timestamptz DEFAULT now()
);

-- Create trainer certifications table
CREATE TABLE IF NOT EXISTS trainer_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  certification_name text NOT NULL,
  issuing_organization text NOT NULL,
  certification_number text,
  issue_date date,
  expiry_date date,
  certification_level text,
  specialization text[],
  verification_url text,
  status text CHECK (status IN ('active', 'expired', 'pending', 'revoked')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session attendance table
CREATE TABLE IF NOT EXISTS session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  attendance_status text CHECK (attendance_status IN ('scheduled', 'checked_in', 'completed', 'no_show', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
  cancellation_reason text,
  cancellation_time timestamptz,
  rescheduled_to timestamptz,
  late_arrival_minutes integer DEFAULT 0,
  early_departure_minutes integer DEFAULT 0,
  makeup_session_scheduled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training programs table (long-term structured programs)
CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  program_type text CHECK (program_type IN ('strength', 'weight_loss', 'muscle_gain', 'endurance', 'rehabilitation', 'sport_specific')) NOT NULL,
  duration_weeks integer NOT NULL,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  target_audience text[],
  prerequisites text[],
  equipment_required text[],
  program_phases jsonb, -- Structured phases of the program
  success_metrics text[],
  is_template boolean DEFAULT false,
  is_public boolean DEFAULT false,
  price decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create program enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES training_programs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_date date DEFAULT CURRENT_DATE,
  start_date date,
  expected_end_date date,
  actual_end_date date,
  current_phase integer DEFAULT 1,
  current_week integer DEFAULT 1,
  status text CHECK (status IN ('enrolled', 'active', 'paused', 'completed', 'dropped')) DEFAULT 'enrolled',
  completion_percentage integer DEFAULT 0,
  custom_modifications jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- Exercises policies
CREATE POLICY "Public exercises are readable by all"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create exercises"
  ON exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own exercises"
  ON exercises
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Exercise variations policies
CREATE POLICY "Exercise variations follow parent exercise permissions"
  ON exercise_variations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = parent_exercise_id
      AND (e.is_public = true OR e.created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
    )
  );

-- Workout templates policies
CREATE POLICY "Public templates are readable by all"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own templates"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own templates"
  ON workout_templates
  FOR ALL
  TO authenticated
  USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Template exercises policies
CREATE POLICY "Template exercises follow template permissions"
  ON template_exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      WHERE wt.id = template_id
      AND (wt.is_public = true OR wt.created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
    )
  );

-- Workout plans policies
CREATE POLICY "Trainers can manage client plans"
  ON workout_plans
  FOR ALL
  TO authenticated
  USING (
    trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can read own plans"
  ON workout_plans
  FOR SELECT
  TO authenticated
  USING (
    client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Plan templates policies
CREATE POLICY "Plan templates follow plan permissions"
  ON plan_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      WHERE wp.id = plan_id
      AND (
        wp.trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR wp.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

-- Workout logs policies
CREATE POLICY "Workout logs follow session permissions"
  ON workout_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN profiles p ON p.id = ws.client_id
      WHERE ws.id = session_id
      AND (
        p.user_id = auth.uid()
        OR ws.trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

-- Session feedback policies
CREATE POLICY "Session feedback for assigned trainer-client pairs"
  ON session_feedback
  FOR ALL
  TO authenticated
  USING (
    trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Client measurements policies
CREATE POLICY "Trainers can manage assigned client measurements"
  ON client_measurements
  FOR ALL
  TO authenticated
  USING (
    client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM client_assignments ca
      WHERE ca.client_id = client_measurements.client_id
      AND ca.trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND ca.status = 'active'
    )
  );

-- Client progress policies
CREATE POLICY "Trainers can manage assigned client progress"
  ON client_progress
  FOR ALL
  TO authenticated
  USING (
    client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Trainer certifications policies
CREATE POLICY "Trainers can manage own certifications"
  ON trainer_certifications
  FOR ALL
  TO authenticated
  USING (trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can read active certifications"
  ON trainer_certifications
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Session attendance policies
CREATE POLICY "Session attendance for involved parties"
  ON session_attendance
  FOR ALL
  TO authenticated
  USING (
    trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Training programs policies
CREATE POLICY "Public programs are readable by all"
  ON training_programs
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can manage own programs"
  ON training_programs
  FOR ALL
  TO authenticated
  USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Program enrollments policies
CREATE POLICY "Program enrollments for involved parties"
  ON program_enrollments
  FOR ALL
  TO authenticated
  USING (
    trainer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_workout_templates_created_by ON workout_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_workout_templates_category ON workout_templates(category);
CREATE INDEX IF NOT EXISTS idx_workout_plans_trainer_client ON workout_plans(trainer_id, client_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_dates ON workout_plans(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template_order ON template_exercises(template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_exercise ON workout_logs(session_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_client_measurements_client_date ON client_measurements(client_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_client_progress_client_date ON client_progress(client_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_trainer_certifications_trainer ON trainer_certifications(trainer_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_type ON training_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_client ON program_enrollments(program_id, client_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_trainer_clients(trainer_uuid uuid)
RETURNS TABLE (
  client_id uuid,
  client_name text,
  client_email text,
  assignment_date date,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    ca.assigned_date,
    ca.status
  FROM client_assignments ca
  JOIN profiles p ON p.id = ca.client_id
  WHERE ca.trainer_id = trainer_uuid
  AND ca.status = 'active'
  ORDER BY ca.assigned_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_client_workout_history(client_uuid uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  session_id uuid,
  session_date date,
  template_name text,
  duration_minutes integer,
  completed boolean,
  exercises_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    ws.date,
    wt.name,
    ws.duration_minutes,
    ws.completed,
    COUNT(wl.id) as exercises_count
  FROM workout_sessions ws
  LEFT JOIN workout_templates wt ON wt.id = ws.template_id
  LEFT JOIN workout_logs wl ON wl.session_id = ws.id
  WHERE ws.client_id = client_uuid
  GROUP BY ws.id, ws.date, wt.name, ws.duration_minutes, ws.completed
  ORDER BY ws.date DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_client_progress_stats(client_uuid uuid)
RETURNS TABLE (
  total_sessions bigint,
  completed_sessions bigint,
  completion_rate decimal,
  avg_session_duration decimal,
  total_training_time_hours decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
    ROUND(
      (COUNT(*) FILTER (WHERE completed = true)::decimal / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as completion_rate,
    ROUND(AVG(duration_minutes), 2) as avg_session_duration,
    ROUND(SUM(duration_minutes) FILTER (WHERE completed = true) / 60.0, 2) as total_training_time_hours
  FROM workout_sessions
  WHERE client_id = client_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;