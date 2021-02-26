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
  public: boolean
  createdAt: string
  updatedAt: string
  parameters: string
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
  OTHER = 0,
  RECRUITMENT = 1,
  GBM = 2,
  SPEAKER = 3,
  FAIR = 4,
  SOCIAL = 5,
  CAREER = 6,
}

export interface ClubEvent {
  badges: Badge[]
  club: string | null
  clubName: string | null
  description: string
  endTime: string
  id: number
  imageUrl: string | null
  isIcsEvent: boolean
  largeImageUrl: string | null
  location: string | null
  name: string
  pinned: boolean
  startTime: string
  type: ClubEventType
  url: string | null
}

export interface ClubApplication {
  id: number
  name: string
  applicationStartTime: string
  applicationEndTime: string
  resultReleaseTime: string
  externalUrl: string
}

export enum ClubSize {
  Small = 1,
  Medium = 2,
  Large = 3,
  VeryLarge = 4,
}

export enum ClubApplicationRequired {
  Open = 1,
  Tryout = 2,
  Audition = 3,
  Application = 4,
  ApplicationAndInterview = 5,
}

export enum ClubRecruitingCycle {
  Unknown = 1,
  Fall = 2,
  Spring = 3,
  Both = 4,
  Open = 5,
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
  department: string
  email: string
  phone: string
  public: boolean
}

export interface Club {
  acceptingMembers: boolean
  active: boolean
  advisorSet: Advisor[]
  applicationRequired: ClubApplicationRequired
  appointmentNeeded: boolean
  approved: boolean | null
  approvedBy: string | null
  approvedComment: string | null
  availableVirtually: boolean
  badges: Badge[]
  code: string
  description: string
  email: string
  enablesSubscription: boolean
  events: ClubEvent[]
  facebook: string
  fairs: number[]
  favoriteCount: number
  files: File[]
  github: string
  howToGetInvolved: string
  icsImportUrl: string
  imageUrl: string
  instagram: string
  isFavorite: boolean
  isGhost: boolean
  isMember: MembershipRank | false
  isRequest: boolean
  isSubscribe: boolean
  linkedin: string
  listserv: string
  members: Membership[]
  membershipCount: number
  name: string
  recruitingCycle: ClubRecruitingCycle
  signatureEvents: string
  size: ClubSize
  studentTypes: StudentType[]
  subtitle: string
  tags: Tag[]
  targetMajors: Major[]
  targetSchools: School[]
  targetYears: Year[]
  testimonials: Testimonial[]
  twitter: string
  website: string
}

export interface ClubFair {
  id: number
  name: string
  organization: string
  contact: string
  time: string

  information: string
  registrationInformation: string
  registrationStartTime: string | null
  registrationEndTime: string

  startTime: string
  endTime: string

  questions: string
}

export interface File {
  id: number
  name: string
  createdAt: string
  fileUrl: string
}

export interface UserInfo {
  email: string
  graduationYear: number
  hasBeenPrompted: boolean
  imageUrl: string
  isSuperuser: boolean
  major: Major[]
  name: string
  school: School[]
  shareBookmarks: boolean
  showProfile: boolean
  username: string
}

export interface UserProfile {
  clubs: (Club & {
    membership: { active: boolean; title: string; role: number }
  })[]
  email: string
  graduationYear: number | null
  imageUrl: string | null
  major: Major[]
  name: string
  public: boolean
  school: School[]
  username: string
}

export type UserMembership = {
  club: Club
  role: MembershipRank
  title: string
  active: boolean
  public: boolean
}

export interface ExtendedUserInfo extends UserInfo {
  membershipSet: {
    code: string
    role: MembershipRank
  }[]
  subscribeSet: { club: string }[]
  favoriteSet: { club: string }[]
}

export interface School {
  id: number
  name: string
  isGraduate: boolean
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

export interface StudentType {
  id: number
  name: string
}

export enum VisitType {
  ClubPage = 1,
  EventModal = 2,
  EventLink = 3,
  ManagePage = 4,
  FairPage = 5,
}

export type DynamicQuestion = {
  name: string
  label: string
  type: string
  choices?: { id: string; label: string }[]
}
