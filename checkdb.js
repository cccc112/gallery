const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, {ssl:'require'});

async function run() {
  try {
    await sql`
      CREATE OR REPLACE FUNCTION public.auto_confirm_user()
      RETURNS trigger AS $$
      BEGIN
        NEW.email_confirmed_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    console.log('Function created');

    await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`;
    console.log('Old trigger dropped');

    await sql`
      CREATE TRIGGER on_auth_user_created
      BEFORE INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_user();
    `;
    console.log('Trigger created');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
