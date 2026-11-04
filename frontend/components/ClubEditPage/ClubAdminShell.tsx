import Link from 'next/link'
import { ReactElement, ReactNode } from 'react'
import Select from 'react-select'
import styled from 'styled-components'

import { GREEN } from '../../constants/colors'
import { MD, mediaMaxWidth } from '../../constants/measurements'
import { HOME_ROUTE, SETTINGS_ROUTE } from '../../constants/routes'
import { UserInfo } from '../../types'
import { SHOW_FEEDBACK, SITE_LOGO, SITE_NAME } from '../../utils/branding'
import { Icon } from '../common'
import {
  selectComponents,
  selectMenuPortalTarget,
  selectMenuStyles,
} from '../common/selectStyles'
import Feedback from '../Header/Feedback'
import {
  ADMIN_ACCENT,
  ADMIN_CANVAS,
  ADMIN_CANVAS_GAP,
  ADMIN_CANVAS_PAD,
  ADMIN_CARD_PAD,
  ADMIN_FONT,
  ADMIN_NAVY,
  ADMIN_PAD_FIELD,
  ADMIN_RADIUS,
} from './adminTheme'

export type AdminNavItem = {
  name: string
  label: string
  icon: string
}

const Page = styled.div`
  background: white;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  overscroll-behavior: none;
`

const Frame = styled.div`
  background: white;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
`

const TopBar = styled.header`
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px 0 20px;
  flex-shrink: 0;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 40;
`

const Brand = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: ${ADMIN_NAVY};
  font-weight: 700;
  font-size: 20px;
  text-decoration: none;

  &:hover {
    color: ${ADMIN_NAVY};
  }
`

const Logo = styled.img`
  height: 27px;
  width: 31px;
  object-fit: contain;
`

const TopLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
`

const TopLink = styled.a`
  color: ${ADMIN_NAVY};
  font-size: 16px;
  text-decoration: none;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: ${ADMIN_NAVY};
  }
`

const Body = styled.div`
  display: flex;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 ${ADMIN_CANVAS_GAP} ${ADMIN_CANVAS_GAP} 0;

  ${mediaMaxWidth(MD)} {
    padding: 0 ${ADMIN_CANVAS_GAP} ${ADMIN_CANVAS_GAP};
  }
`

const Sidebar = styled.nav`
  width: 208px;
  flex-shrink: 0;
  padding: 0 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  overflow: auto;
  position: sticky;
  top: 0;
  align-self: stretch;

  ${mediaMaxWidth(MD)} {
    display: none;
  }
`

const ClubCard = styled.div`
  background: ${ADMIN_CANVAS};
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
`

const ClubName = styled.div`
  color: ${ADMIN_NAVY};
  font-weight: 600;
  font-size: 15px;
  line-height: 1.3;
`

const AdminMode = styled.div`
  color: #42424f;
  font-size: 11px;
  margin-top: 2px;
`

const NavButton = styled.button<{ $active?: boolean }>`
  appearance: none;
  border: 0;
  background: ${({ $active }) => ($active ? ADMIN_CANVAS : 'transparent')};
  color: ${ADMIN_NAVY};
  border-radius: 6px;
  text-align: left;
  font-size: 14px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  width: 100%;

  &:hover {
    background: ${ADMIN_CANVAS};
  }
`

const ExtraLabel = styled.div`
  margin: 14px 10px 4px;
  font-size: 11px;
  color: #42424f;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const Canvas = styled.main<{ $plain?: boolean }>`
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: ${({ $plain }) => ($plain ? 'white' : ADMIN_CANVAS)};
  border-radius: ${({ $plain }) => ($plain ? '0' : '10px')};
  margin: 0;
  padding: ${({ $plain }) => ($plain ? '0' : ADMIN_CANVAS_PAD)};
  overflow: ${({ $plain }) => ($plain ? 'hidden' : 'auto')};
  display: ${({ $plain }) => ($plain ? 'flex' : 'block')};
  flex-direction: column;
  font-size: ${ADMIN_FONT};

  ${mediaMaxWidth(MD)} {
    padding: ${({ $plain }) => ($plain ? '0' : ADMIN_CANVAS_PAD)};
  }

  .card {
    box-shadow: none !important;
    border: none !important;
    border-radius: 10px !important;
    background: white;
  }

  .card:last-child {
    margin-bottom: 0 !important;
  }

  .card-header,
  .card-header-title {
    box-shadow: none !important;
    border-bottom: none !important;
    color: ${ADMIN_NAVY};
  }

  .card-header {
    align-items: center;
  }

  .card-header-title {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.3;
    padding: ${ADMIN_CARD_PAD} ${ADMIN_CARD_PAD} 0.35rem;
    align-items: center;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: ${ADMIN_PAD_FIELD};
    padding: 0.75rem ${ADMIN_CARD_PAD} ${ADMIN_CARD_PAD};
  }

  .card-content > * {
    min-width: 0;
  }

  .card-content > p {
    margin: 0;
  }

  .card-content > .field,
  .card-content > .field:not(:last-child) {
    margin-bottom: 0 !important;
  }

  .card-content form .field:not(:last-child) {
    margin-bottom: 16px;
  }

  #student-questions .card-content {
    gap: 0.75rem;
  }

  #student-questions .card-content > div {
    margin-bottom: 0;
  }

  #student-questions .card-content form .field:not(:last-child) {
    margin-bottom: 8px;
  }

  .card-content form .buttons {
    margin: 0;
  }

  .textarea {
    padding: 12px 14px;
    min-height: 6.5rem;
  }

  .rdw-editor-main {
    padding: 12px 14px !important;
    min-height: 8rem;
  }

  .checkbox,
  label.checkbox {
    align-items: center;
    display: inline-flex !important;
    gap: 8px;
  }

  .checkbox input[type='checkbox'] {
    margin: 0;
  }

  [data-icon] svg {
    width: 16px !important;
    height: 16px !important;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${ADMIN_NAVY};
    font-weight: 400;
    font-size: ${ADMIN_FONT};
    line-height: 1.2;
  }

  select:not([multiple]):not(.table-footer-select) {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    min-height: 38px;
    padding: 8px 32px 8px 10px;
    background-color: ${ADMIN_CANVAS};
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23757575' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 12px;
    border: 1px solid #d8d8d8;
    border-radius: 10px;
    box-shadow: none;
    color: ${ADMIN_NAVY};
    font-size: ${ADMIN_FONT};
  }

  .select {
    width: 100%;
  }

  .select select {
    width: 100%;
  }

  .select:not(.is-multiple):not(.is-loading)::after {
    display: none !important;
  }

  .input,
  .textarea,
  .react-datepicker-wrapper .input,
  input[type='text'],
  input[type='email'],
  input[type='url'],
  input[type='number'],
  input[type='date'] {
    background: ${ADMIN_CANVAS};
    border-color: #d8d8d8;
    border-radius: 10px;
    box-shadow: none;
    color: ${ADMIN_NAVY};
    font-size: ${ADMIN_FONT};
  }

  .rdw-editor-wrapper {
    background: ${ADMIN_CANVAS};
    border: 1px solid #d8d8d8;
    border-radius: 10px;
    overflow: hidden;
  }

  .rdw-editor-toolbar {
    background: ${ADMIN_CANVAS};
    border-bottom: 1px solid #d8d8d8;
  }

  .rdw-editor-main {
    background: ${ADMIN_CANVAS} !important;
    border: none !important;
  }

  .field:not(:last-child) {
    margin-bottom: ${ADMIN_PAD_FIELD};
  }

  .button {
    border-radius: ${ADMIN_RADIUS};
    font-size: ${ADMIN_FONT};
  }

  .button.is-primary,
  .button.is-link:not(.is-light) {
    background-color: ${ADMIN_ACCENT};
    border-color: transparent;
    color: #fff;
  }

  .button.is-primary:hover,
  .button.is-link:not(.is-light):hover {
    background-color: #3b45d4;
    color: #fff;
  }

  .help {
    color: #42424f;
  }
`

const Main = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`

const MobileNav = styled.div`
  display: none;
  flex-shrink: 0;
  padding: 0 0 ${ADMIN_CANVAS_GAP};
  position: relative;
  z-index: 6;

  ${mediaMaxWidth(MD)} {
    display: block;
  }
`

export const PageHeading = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 ${ADMIN_CANVAS_GAP};
`

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${ADMIN_NAVY};
`

export const ViewLink = styled.a`
  color: ${GREEN};
  font-weight: 600;
  font-size: 20px;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: ${GREEN};
  }
`

type Props = {
  clubName: string
  inactive?: boolean
  userInfo?: UserInfo
  items: AdminNavItem[]
  extraItems?: AdminNavItem[]
  active: string
  onNavigate: (name: string) => void
  children: ReactNode
}

export default function ClubAdminShell({
  clubName,
  inactive,
  userInfo,
  items,
  extraItems = [],
  active,
  onNavigate,
  children,
}: Props): ReactElement<any> {
  const accountName = userInfo?.name || userInfo?.username
  const allItems = [...items, ...extraItems]

  const renderItem = (item: AdminNavItem) => (
    <NavButton
      key={item.name}
      type="button"
      $active={item.name === active}
      onClick={() => onNavigate(item.name)}
    >
      <Icon name={item.icon} alt="" size="1.15rem" />
      {item.label}
    </NavButton>
  )

  return (
    <Page>
      <Frame>
        <TopBar>
          <Link href={HOME_ROUTE} passHref legacyBehavior>
            <Brand>
              <Logo src={SITE_LOGO} alt="" />
              {SITE_NAME}
            </Brand>
          </Link>
          <TopLinks aria-label="Site">
            <Link href="/clubs" passHref legacyBehavior>
              <TopLink>Clubs</TopLink>
            </Link>
            <Link href="/events" passHref legacyBehavior>
              <TopLink>Events</TopLink>
            </Link>
            <Link href="/faq" passHref legacyBehavior>
              <TopLink>FAQ</TopLink>
            </Link>
            {accountName && (
              <Link href={SETTINGS_ROUTE} passHref legacyBehavior>
                <TopLink>
                  <Icon name="user" alt="" size="1rem" />
                  {accountName}
                </TopLink>
              </Link>
            )}
          </TopLinks>
        </TopBar>
        <Body>
          <Sidebar aria-label="Club admin">
            <ClubCard>
              <ClubName>{clubName}</ClubName>
              <AdminMode>{inactive ? 'Inactive' : 'Admin Mode'}</AdminMode>
            </ClubCard>
            {items.map(renderItem)}
            {extraItems.length > 0 && (
              <>
                <ExtraLabel>More</ExtraLabel>
                {extraItems.map(renderItem)}
              </>
            )}
          </Sidebar>
          <Main>
            <MobileNav>
              <Select
                aria-label="Club admin section"
                styles={selectMenuStyles}
                components={selectComponents}
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                isSearchable={false}
                options={allItems.map((item) => ({
                  value: item.name,
                  label: item.label,
                }))}
                value={
                  allItems
                    .map((item) => ({
                      value: item.name,
                      label: item.label,
                    }))
                    .find((item) => item.value === active) ?? null
                }
                onChange={(option) => {
                  if (option) {
                    onNavigate(option.value)
                  }
                }}
              />
            </MobileNav>
            <Canvas
              className="admin-canvas"
              id="club-edit-content"
              $plain={
                active === 'member' ||
                active === 'events' ||
                active === 'recruitment'
              }
            >
              {children}
            </Canvas>
          </Main>
        </Body>
        {SHOW_FEEDBACK && <Feedback />}
      </Frame>
    </Page>
  )
}
