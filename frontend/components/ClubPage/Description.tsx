import { ReactElement, useEffect, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import styled from 'styled-components'

import { Club } from '../../types'
import {
  apiCheckPermission,
  doApiRequest,
  EMPTY_DESCRIPTION,
} from '../../utils'
import { StrongText } from '../common'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

// links whose url changed are marked by the diff with the old and new url
const DiffContent = styled.div`
  [data-tooltip-id='link-diff'] {
    cursor: help;
  }

  [data-tooltip-id='link-diff']::after {
    content: '';
    display: inline-block;
    width: 0.85em;
    height: 0.85em;
    margin-left: 0.25em;
    vertical-align: -0.1em;
    background-color: currentColor;
    mask: url('/static/img/icons/link.svg') center / contain no-repeat;
  }

  // like GitLens, a faded note after each changed paragraph says who changed it
  &.show-editors [data-editors]::after {
    content: attr(data-editors);
    margin-left: 1em;
    color: #9ca3af;
    font-size: 0.8em;
    font-style: italic;
    white-space: nowrap;
  }
`

// notes who changed each paragraph, and when they last did, as "Name, Oct 9"
const tagEditors = (el: HTMLDivElement | null) => {
  const blocks = el?.querySelectorAll(':scope > :not(ul, ol), :scope > * > li')
  for (const block of Array.from(blocks ?? [])) {
    const tags = Array.from(block.querySelectorAll('[data-editor]'))
    if (!tags.length) continue
    const names = new Set(tags.map((tag) => tag.getAttribute('data-editor')))
    const last = Math.max(
      ...tags.map((tag) => Date.parse(tag.getAttribute('data-edited') ?? '')),
    )
    const date = new Date(last).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    block.setAttribute(
      'data-editors',
      `${Array.from(names).join(', ')}, ${date}`,
    )
  }
}

const LinkDiff = styled.div`
  max-width: 360px;
  word-break: break-all;
`

type DescProps = {
  club: Club
}

type ClubDiff = {
  description: {
    old: string
    new: string
    diff: string
  }
  name: {
    old: string
    new: string
    diff: string
  }
  image: {
    old: string
    new: string
  }
}

const Description = ({ club }: DescProps): ReactElement => {
  const [diffs, setDiffs] = useState<ClubDiff | null>(null)
  const [showEditors, setShowEditors] = useState(false)
  // reviewers who can only reject still need to see what changed
  const canReviewApproval =
    apiCheckPermission('clubs.approve_club') ||
    apiCheckPermission('clubs.reject_club')
  const canDeleteClub = apiCheckPermission('clubs.delete_club')

  const NewDescription = () => {
    return (
      <Wrapper>
        <div style={{ width: '100%' }}>
          <StrongText>Club Mission</StrongText>
          <div></div>
          <div
            className="content"
            dangerouslySetInnerHTML={{
              __html: club.description || EMPTY_DESCRIPTION,
            }}
          />
        </div>
      </Wrapper>
    )
  }

  if (!canReviewApproval || club.approved === false) {
    return <NewDescription />
  }

  const retrieveDiffs = async () => {
    const resp = await doApiRequest(
      `/clubs/${club.code}/club_detail_diff/?format=json`,
      {
        method: 'GET',
      },
    )
    const json = await resp.json()
    return json[club.code]
  }

  if (club.approved == null) {
    useEffect(() => {
      const fetchDiffs = async () => {
        if (club.approved == null) {
          const resp = await retrieveDiffs()
          if (
            resp === 'No changes that require approval made since last approval'
          ) {
            setDiffs(null)
          } else {
            setDiffs(resp)
          }
        }
      }
      fetchDiffs()
    }, [club.code])

    if (diffs != null) {
      const display = diffs.description.diff
      return (
        <Wrapper>
          <div style={{ width: '100%' }}>
            <StrongText>Description</StrongText>
            <button
              className="button is-small mb-3"
              title="Show the name of the person who made each highlighted change"
              onClick={() => setShowEditors(!showEditors)}
            >
              {showEditors ? 'Hide editors' : 'Show editors'}
            </button>
            <DiffContent
              // React redraws the HTML on every render, wiping the editor notes,
              // so a new function each render makes React tag them again
              ref={(el) => tagEditors(el)}
              className={showEditors ? 'content show-editors' : 'content'}
              dangerouslySetInnerHTML={{
                __html: display || EMPTY_DESCRIPTION,
              }}
            />
            <Tooltip
              id="link-diff"
              render={({ activeAnchor }) => (
                <LinkDiff>
                  <div>
                    <b>Old link:</b> {activeAnchor?.dataset.oldLink || 'none'}
                  </div>
                  <div>
                    <b>New link:</b> {activeAnchor?.dataset.newLink || 'none'}
                  </div>
                </LinkDiff>
              )}
            />
          </div>
        </Wrapper>
      )
    }
  }

  return <NewDescription />
}

export default Description
