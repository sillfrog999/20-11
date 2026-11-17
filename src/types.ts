export type Greeting = {
  id: string
  author_name: string | null
  is_anonymous: boolean
  content: string
  status?: 'pending' | 'approved' | 'rejected'
  created_at: string
  reaction_counts?: Record<string, number>
  comment_count?: number
}

export type Memory = {
  id: string
  title: string
  caption: string
  media_type: 'image' | 'video'
  media_url: string
  thumbnail_url?: string | null
  author_name?: string | null
  tag?: string
  created_at: string
  sort_order?: number
}

export type Confession = {
  id: string
  pen_name: string
  category: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reaction_counts?: Record<string, number>
  comment_count?: number
}

export type Comment = {
  id: string
  target_type: 'greeting' | 'confession' | 'memory'
  target_id: string
  author_name: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type Reaction = {
  id: string
  target_type: 'greeting' | 'confession' | 'memory'
  target_id: string
  reaction_type: string
  created_at: string
}

export type Report = {
  id: string
  target_type: 'greeting' | 'confession' | 'comment'
  target_id: string
  reason: string
  details?: string
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
}

export type SiteSettings = {
  teacher_name: string
  allow_anonymous: boolean
  announcement?: string
}
