-- Paje Digital - Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups (families) table
CREATE TABLE groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Gifts table
CREATE TABLE gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift reservations table
CREATE TABLE gift_reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  gift_id UUID REFERENCES gifts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gift_id, user_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid() = admin_id);

-- Group members policies
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can remove members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.admin_id = auth.uid()
    )
  );

-- Gifts policies
CREATE POLICY "Users can view gifts in their groups"
  ON gifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = gifts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create gifts in their groups"
  ON gifts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = gifts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own gifts"
  ON gifts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gifts"
  ON gifts FOR DELETE
  USING (auth.uid() = user_id);

-- Gift reservations policies
CREATE POLICY "Users can view reservations in their groups"
  ON gift_reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gifts
      JOIN group_members ON group_members.group_id = gifts.group_id
      WHERE gifts.id = gift_reservations.gift_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reservations (not their own gifts)"
  ON gift_reservations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM gifts
      WHERE gifts.id = gift_reservations.gift_id
      AND gifts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reservations"
  ON gift_reservations FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Functions for notifications

-- Function to notify when a new gift is added
CREATE OR REPLACE FUNCTION notify_new_gift()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, group_id, type, message)
  SELECT 
    gm.user_id,
    NEW.group_id,
    'new_gift',
    (SELECT username FROM profiles WHERE id = NEW.user_id) || ' ha añadido un nuevo regalo: ' || NEW.name
  FROM group_members gm
  WHERE gm.group_id = NEW.group_id
  AND gm.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when a gift is reserved
CREATE OR REPLACE FUNCTION notify_gift_reserved()
RETURNS TRIGGER AS $$
DECLARE
  gift_name TEXT;
  gift_owner_id UUID;
  reserver_name TEXT;
BEGIN
  SELECT name, user_id INTO gift_name, gift_owner_id
  FROM gifts WHERE id = NEW.gift_id;
  
  SELECT username INTO reserver_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notify all members except the gift owner and the reserver
  INSERT INTO notifications (user_id, group_id, type, message)
  SELECT 
    gm.user_id,
    g.group_id,
    'gift_reserved',
    reserver_name || ' va a regalar: ' || gift_name
  FROM group_members gm
  JOIN gifts g ON g.id = NEW.gift_id
  WHERE gm.group_id = g.group_id
  AND gm.user_id != gift_owner_id
  AND gm.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_gift_created
  AFTER INSERT ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_gift();

CREATE TRIGGER on_gift_reserved
  AFTER INSERT ON gift_reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_gift_reserved();

-- Storage bucket for gift images
-- Note: This needs to be created manually in Supabase Storage UI
-- Bucket name: gift-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Storage policies (to be applied after creating the bucket)
-- CREATE POLICY "Anyone can view gift images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'gift-images');

-- CREATE POLICY "Authenticated users can upload gift images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'gift-images'
--     AND auth.role() = 'authenticated'
--   );

-- CREATE POLICY "Users can delete their own gift images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'gift-images'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
