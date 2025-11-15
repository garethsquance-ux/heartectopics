-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('free', 'subscriber', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'subscriber' THEN 2
    WHEN 'free' THEN 3
  END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create wellness_faqs table
CREATE TABLE public.wellness_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  hit_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.wellness_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active FAQs"
ON public.wellness_faqs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
ON public.wellness_faqs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create user_chat_usage table
CREATE TABLE public.user_chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_count INTEGER DEFAULT 0,
  monthly_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.user_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
ON public.user_chat_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
ON public.user_chat_usage FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
ON public.user_chat_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
ON public.user_chat_usage FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create community_posts table
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('research', 'medical_advances', 'studies', 'personal_stories')),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view published posts"
ON public.community_posts FOR SELECT
USING (
  is_published = true AND (
    public.has_role(auth.uid(), 'subscriber') OR
    public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Admins can manage posts"
ON public.community_posts FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create community_comments table
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view comments"
ON public.community_comments FOR SELECT
USING (
  public.has_role(auth.uid(), 'subscriber') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Subscribers can create comments"
ON public.community_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    public.has_role(auth.uid(), 'subscriber') OR
    public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can update own comments"
ON public.community_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
ON public.community_comments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create moderation_actions table
CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('comment_deleted', 'user_warned', 'comment_flagged')),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation actions"
ON public.moderation_actions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create moderation actions"
ON public.moderation_actions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = moderator_id);

-- Create trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for wellness_faqs updated_at
CREATE TRIGGER update_wellness_faqs_updated_at
BEFORE UPDATE ON public.wellness_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for user_chat_usage updated_at
CREATE TRIGGER update_user_chat_usage_updated_at
BEFORE UPDATE ON public.user_chat_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for community_posts updated_at
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for community_comments updated_at
CREATE TRIGGER update_community_comments_updated_at
BEFORE UPDATE ON public.community_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to assign free role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();

-- Insert some starter FAQs
INSERT INTO public.wellness_faqs (question, answer, keywords) VALUES
('What are ectopic heartbeats?', 'Ectopic heartbeats (also called premature beats or extra beats) are heartbeats that occur earlier than expected in your heart rhythm. They are extremely common and usually harmless. Most people experience them occasionally, though you may not always notice them.', ARRAY['ectopic', 'what are', 'definition', 'premature', 'extra beats']),
('Are ectopic heartbeats dangerous?', 'For most people, ectopic heartbeats are not dangerous and don''t require treatment. They are very common and usually harmless. However, if you experience frequent episodes, dizziness, chest pain, or shortness of breath, you should consult your healthcare provider.', ARRAY['dangerous', 'harmful', 'serious', 'worry', 'concern']),
('Why do I get more ectopic heartbeats?', 'Common triggers include stress, anxiety, caffeine, alcohol, lack of sleep, dehydration, and certain medications. Some people notice them more when lying down or during quiet moments. Keeping track of your episodes can help identify your personal triggers.', ARRAY['why', 'causes', 'triggers', 'more frequent', 'increase']),
('Should I see a doctor?', 'Most ectopic heartbeats don''t require medical attention. However, you should consult a healthcare provider if you experience: frequent or worsening episodes, chest pain, dizziness or fainting, shortness of breath, or if you''re concerned about your symptoms.', ARRAY['doctor', 'medical', 'healthcare', 'see someone', 'consult']),
('How can I reduce ectopic heartbeats?', 'Try these strategies: reduce caffeine and alcohol, manage stress through relaxation techniques, ensure adequate sleep, stay hydrated, exercise regularly (with your doctor''s approval), and avoid known personal triggers. Many people find that lifestyle modifications help reduce episodes.', ARRAY['reduce', 'prevent', 'stop', 'minimize', 'less frequent', 'help']);