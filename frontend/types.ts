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
}
