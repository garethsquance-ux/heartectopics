-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false);

-- Create table to track episode documents
CREATE TABLE public.episode_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.heart_episodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.episode_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for episode_documents
CREATE POLICY "Users can view own documents"
ON public.episode_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
ON public.episode_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON public.episode_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_episode_documents_updated_at
BEFORE UPDATE ON public.episode_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for medical-documents bucket
CREATE POLICY "Users can upload their own medical documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'medical-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own medical documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own medical documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'medical-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);