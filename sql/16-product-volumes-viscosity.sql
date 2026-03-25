-- Pack sizes & viscosity grades (catalogue-driven; products store TEXT values)
CREATE TABLE IF NOT EXISTS product_volumes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS viscosity_grades (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO product_volumes (name) VALUES
  ('1L'), ('4L'), ('5L'), ('20L'), ('208L')
ON CONFLICT (name) DO NOTHING;

INSERT INTO viscosity_grades (name) VALUES
  ('5W-30'), ('5W-40'), ('10W-40'), ('15W-40')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE product_volumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_product_volumes" ON product_volumes;
CREATE POLICY "allow_all_product_volumes"
  ON product_volumes FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE viscosity_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_viscosity_grades" ON viscosity_grades;
CREATE POLICY "allow_all_viscosity_grades"
  ON viscosity_grades FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

GRANT ALL ON product_volumes TO anon, authenticated;
GRANT ALL ON viscosity_grades TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE product_volumes_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE viscosity_grades_id_seq TO anon, authenticated;
