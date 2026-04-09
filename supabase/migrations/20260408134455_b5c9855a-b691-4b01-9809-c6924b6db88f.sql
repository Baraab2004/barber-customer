
-- Create barbers table
CREATE TABLE public.barbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  speciality TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  barber_id UUID NOT NULL REFERENCES public.barbers(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  is_home_service BOOLEAN NOT NULL DEFAULT false,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  payment_method TEXT NOT NULL DEFAULT 'visa' CHECK (payment_method IN ('visa', 'cash')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_barber_slot UNIQUE (barber_id, booking_date, booking_time)
);

-- Create index for faster booking lookups
CREATE INDEX idx_bookings_barber_date ON public.bookings(barber_id, booking_date) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_phone ON public.bookings(customer_phone);

-- Enable RLS
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Barbers: anyone can view
CREATE POLICY "Anyone can view barbers" ON public.barbers FOR SELECT USING (true);

-- Services: anyone can view
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);

-- Bookings: anyone can view, insert, update (for cancellation)
CREATE POLICY "Anyone can view bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bookings" ON public.bookings FOR UPDATE USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed barbers
INSERT INTO public.barbers (name, phone, speciality) VALUES
  ('أحمد الشمري', '0501234567', 'قص شعر كلاسيكي'),
  ('محمد العتيبي', '0507654321', 'تصفيف لحية'),
  ('خالد القحطاني', '0509876543', 'صبغة وعناية');

-- Seed services
INSERT INTO public.services (name, description, price, duration_minutes) VALUES
  ('قص شعر', 'قص شعر احترافي مع تصفيف', 50.00, 40),
  ('حلاقة لحية', 'تشذيب وتصفيف اللحية', 30.00, 40),
  ('صبغة شعر', 'صبغة شعر بألوان متعددة', 120.00, 40),
  ('عناية بالبشرة', 'تنظيف وترطيب البشرة', 80.00, 40),
  ('باكج كامل', 'قص شعر + لحية + عناية بالبشرة', 150.00, 40);
