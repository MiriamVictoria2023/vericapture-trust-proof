
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  assigned_to TEXT NOT NULL DEFAULT 'Current User',
  evidence_count INTEGER NOT NULL DEFAULT 0,
  access_expiry TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cases" ON public.cases FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Evidence records table
CREATE TABLE public.evidence_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'unknown',
  sha256_hash TEXT NOT NULL,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  device_info TEXT,
  status TEXT NOT NULL DEFAULT 'scanning' CHECK (status IN ('scanning', 'cleared', 'rejected', 'quarantined')),
  notary_hash TEXT,
  block_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own evidence" ON public.evidence_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own evidence" ON public.evidence_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evidence" ON public.evidence_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence" ON public.evidence_records FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_evidence_updated_at BEFORE UPDATE ON public.evidence_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Custody log table
CREATE TABLE public.custody_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES public.evidence_records(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('uploaded', 'viewed', 'downloaded', 'transferred', 'verified')),
  actor TEXT NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '0.0.0.0',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custody_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own custody logs" ON public.custody_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own custody logs" ON public.custody_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blockchain ledger table
CREATE TABLE public.blockchain_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_index INTEGER NOT NULL,
  evidence_hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  nonce INTEGER NOT NULL,
  block_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blockchain_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ledger" ON public.blockchain_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ledger entries" ON public.blockchain_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);
