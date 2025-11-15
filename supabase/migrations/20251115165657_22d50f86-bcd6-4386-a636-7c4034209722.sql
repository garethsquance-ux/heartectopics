-- Add document analysis tracking to user_chat_usage table
ALTER TABLE public.user_chat_usage
ADD COLUMN IF NOT EXISTS document_analysis_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_document_analysis_date DATE;

-- Add comment explaining the columns
COMMENT ON COLUMN public.user_chat_usage.document_analysis_count IS 'Number of document analyses performed this month';
COMMENT ON COLUMN public.user_chat_usage.last_document_analysis_date IS 'Last date when monthly document analysis count was reset';