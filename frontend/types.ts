/* eslint-disable camelcase */
export enum MembershipRank {
  Owner = 0,
  Officer = 10,
  Member = 20,
}

export interface Report {
  id: number
  name: string
  creator: string
  description: string
  created_at: string
  updated_at: string
}

export interface Membership {
  name: string
  title: string
  role: MembershipRank
  active: boolean
  public: boolean
  image: string | null
  email: string
  username: string
}

export interface Testimonial {
  id: number
  text: string
}

export interface ClubEvent {
  id: number
  start_time: number
  location: string
  name: string
}

export enum ClubSize {
  Small = 1,
  Medium = 2,
  Large = 3,
  VeryLarge = 4,
}

export enum ClubApplicationRequired {
  None = 1,
  Some = 2,
  All = 3,
}

export interface Tag {
  kind: 'tag'
  id: number
  name: string
  clubs?: number
}

export interface Badge {
  kind: 'badge'
  id: number
  label: string
  color: string
  description: string
}

export interface QuestionAnswer {
  id: number
  approved: boolean
  question: string
  answer: string
  author: string
  responder: string
}

export interface Club {
  name: string
  image_url: string
  code: string
  active: boolean
  approved: boolean | null
  accepting_members: boolean
  application_required: ClubApplicationRequired
  description: string
  subtitle: string
  tags: [Tag]
  badges: [Badge]
  events: [ClubEvent]
  testimonials: [Testimonial]
  members: [Membership]
  size: ClubSize
  email: string
  facebook: string
  website: string
  twitter: string
  instagram: string
  linkedin: string
  github: string
  listserv: string
  how_to_get_involved: string
  questions: [QuestionAnswer]
  favorite_count: number
  is_member: MembershipRank | false
  is_favorite: boolean
  is_subscribe: boolean
  is_request: boolean
}

export interface UserInfo {
  email: string
  graduation_year: number
  has_been_prompted: boolean
  name: string
  username: string
  is_superuser: boolean
  image_url: string
}
