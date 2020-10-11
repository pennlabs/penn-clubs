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

export enum ClubEventType {
  RECRUITMENT = 1,
  GBM = 2,
  SPEAKER = 3,
  FAIR = 4,
}

export interface ClubEvent {
  id: number
  name: string
  badges: Badge[]
  club: string
  club_name: string
  description: string
  start_time: string
  end_time: string
  image_url: string | null
  large_image_url: string | null
  location: string | null
  url: string | null
  type: ClubEventType
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
  purpose: string
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

export interface Advisor {
  id: number
  name: string
  title: string
  school: School[]
  email: string
  phone: string
  public: boolean
}

export interface Club {
  accepting_members: boolean
  enables_subscription: boolean
  active: boolean
  advisor_set: Advisor[]
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
  share_bookmarks: boolean
  name: string
  username: string
  is_superuser: boolean
  image_url: string
  school: School[]
  major: Major[]
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

export interface School {
  id: number
  name: string
}

export interface Major {
  id: number
  name: string
}

export interface Year {
  id: number
  name: string
  year: number
}
