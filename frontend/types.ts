/* eslint-disable camelcase */
export enum MembershipRank {
  Owner = 0,
  Officer = 10,
  Member = 20,
}

export interface MembershipRole {
  value: number
  label: string
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
  id: number
  name: string
  clubs?: number
}

export interface Badge {
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
  accepting_members: boolean
  active: boolean
  application_required: ClubApplicationRequired
  approved: boolean | null
  approved_by: string | null
  approved_comment: string | null
  badges: [Badge]
  code: string
  description: string
  email: string
  events: [ClubEvent]
  facebook: string
  fair: boolean
  favorite_count: number
  files: File[]
  github: string
  how_to_get_involved: string
  image_url: string
  instagram: string
  is_favorite: boolean
  is_member: MembershipRank | false
  is_request: boolean
  is_subscribe: boolean
  is_ghost: boolean
  linkedin: string
  listserv: string
  members: [Membership]
  name: string
  size: ClubSize
  subtitle: string
  tags: [Tag]
  testimonials: [Testimonial]
  twitter: string
  website: string
}

export interface File {
  id: number
  name: string
  created_at: string
  file_url: string
}

export interface UserInfo {
  email: string
  graduation_year: number
  has_been_prompted: boolean
  name: string
  username: string
  is_superuser: boolean
  image_url: string
  school: any[]
  major: any[]
}

export type UserMembership = {
  club: Club
  role: MembershipRank
  title: string
  active: boolean
  public: boolean
}

export interface ExtendedUserInfo extends UserInfo {
  membership_set: {
    code: string
    role: MembershipRank
  }[]
  subscribe_set: { club: string }[]
  favorite_set: { club: string }[]
}
