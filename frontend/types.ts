/* eslint-disable camelcase */
export enum Membership {
  Owner = 0,
  Officer = 10,
  Member = 20,
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
  approved: boolean
  accepting_members: boolean
  application_required: ClubApplicationRequired
  description: string
  subtitle: string
  tags: [Tag]
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
  is_member: Membership | false
  is_favorite: boolean
  is_subscribe: boolean
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
