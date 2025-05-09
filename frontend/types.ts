/* eslint-disable camelcase */
export type Maybe<T> = T | undefined

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
  created_at: string
  updated_at: string
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
  showings?: EventShowing[]
  badges: Badge[]
  club: string | null
  club_name: string | null
  description: string
  id: number
  image_url: string | null
  is_ics_event: boolean
  large_image_url: string | null
  name: string
  ticketed: boolean
  pinned: boolean
  type: ClubEventType
  url: string | null
  earliest_start_time?: string
  latest_end_time?: string
  earliest_end_time?: string
  latest_start_time?: string
}

export interface EventShowing {
  event?: ClubEvent
  id: number
  start_time: string
  end_time: string
  location: string | null
  ticket_order_limit: number
  ticket_drop_time?: string | null
  ticketed: boolean
}

export interface EventTicket {
  id: string
  event: ClubEvent
  showing: EventShowing
  type: string
  owner: string
  price: string
}

export interface CountedEventTicket extends EventTicket {
  count?: number
}

export enum AdvisorVisibilityType {
  AdminOnly = 1,
  Students = 2,
  All = 3,
}

export interface ClubApplication {
  id: number
  name: string
  application_start_time: string
  application_end_time: string
  application_end_time_exception: boolean
  cycle: string
  result_release_time: string
  external_url: string
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
  message?: string
}

export interface QuestionAnswer {
  id: number
  likes: number
  approved: boolean
  question: string
  answer: string
  author: string
  responder: string
  user_liked: boolean
}

export interface Advisor {
  id: number
  name: string
  title: string
  department: string
  email: string
  phone: string
  visibility: AdvisorVisibilityType
}

export interface Club {
  accepting_members: boolean
  active: boolean
  advisor_set: Advisor[]
  application_required: ClubApplicationRequired
  appointment_needed: boolean
  approved: boolean | null
  approved_by: string | null
  approved_comment: string | null
  available_virtually: boolean
  badges: Badge[]
  beta: boolean
  code: string
  description: string
  email: string
  enables_subscription: boolean
  events: ClubEvent[]
  facebook: string
  fairs: number[]
  favorite_count: number
  files: File[]
  github: string
  how_to_get_involved: string
  ics_import_url: string
  image_url: string
  instagram: string
  is_favorite: boolean
  is_ghost: boolean
  is_member: MembershipRank | false
  is_request: boolean
  is_subscribe: boolean
  is_wharton: boolean
  linkedin: string
  listserv: string
  members: Membership[]
  /**
   * @deprecated
   * use `members.length` instead
   */
  membership_count: number
  name: string
  recruiting_cycle: ClubRecruitingCycle
  signature_events: string
  size: ClubSize
  student_types: StudentType[]
  subtitle: string
  tags: Tag[]
  target_majors: Major[]
  target_schools: School[]
  target_years: Year[]
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
  registration_information: string
  registration_start_time: string | null
  registration_end_time: string

  start_time: string
  end_time: string

  questions: string
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
  image_url: string
  is_superuser: boolean
  major: Major[]
  name: string
  school: School[]
  share_bookmarks: boolean
  show_profile: boolean
  username: string
}

export interface UserProfile {
  clubs: (Club & {
    membership: { active: boolean; title: string; role: number }
  })[]
  email: string
  graduation_year: number | null
  image_url: string | null
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
  is_graduate: boolean
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

export type Application = {
  id: number
  name: string
  description: string
  application_start_time: string
  application_end_time: string
  acceptance_email: string
  rejection_email: string
  result_release_time: string
  updated_at: string
  external_url: string | null
  committees: Array<{ name: string }> | null
  club: string
  club_image_url: string
  questions: ApplicationQuestion[]
}

export type ApplicationStatus = {
  club: string
  application: number
  committee: string
  name: string
  status: string
  count: number
}

export enum ApplicationQuestionType {
  FreeResponse = 1,
  MultipleChoice = 2,
  ShortAnswer = 3,
  InfoText = 4,
}

export type ApplicationQuestion = {
  id: number
  question_type: ApplicationQuestionType
  prompt: string
  word_limit: number
  committees: Array<{ name: string }>
  multiple_choice: [
    {
      value: string
    },
  ]
  committee_question: boolean
}

export enum ApplicationStatusType {
  Pending = 1,
  RejectedWritten = 2,
  RejectedInterview = 3,
  Accepted = 4,
}

export const APPLICATION_STATUS_TYPES = [
  {
    value: ApplicationStatusType.Pending,
    label: 'Pending',
  },
  {
    value: ApplicationStatusType.RejectedWritten,
    label: 'Rejected after written application',
  },
  {
    value: ApplicationStatusType.RejectedInterview,
    label: 'Rejected after interview(s)',
  },
  {
    value: ApplicationStatusType.Accepted,
    label: 'Accepted',
  },
]

export type ApplicationSubmission = {
  pk: number
  application: number
  committee: string | null
  created_at: string
  first_name: string
  last_name: string
  status: string
  responses: Array<ApplicationResponse>
  club: string
  code: string
  notified: boolean
  reason: string
  application_link: string
}

export type ApplicationResponse = {
  text: string | null
  multiple_choice: {
    value: string
  }
  question_type: string
  question: ApplicationQuestion
}

export type TicketEntry = {
  type: string
  count: number
  price: number
}

export type TicketAvailability = {
  totals: TicketEntry[]
  available: TicketEntry[]
}

export type Template = {
  id: number
  author: string
  title: string
  content: string
}

export type RegistrationQueueSettings = {
  reapproval_queue_open: boolean
  new_approval_queue_open: boolean
  updated_at: string
  updated_by: string
}

export type OwnershipRequest = {
  id: number
  club: string
  club_name: string
  name: string
  username: string
  created_at: string
}
