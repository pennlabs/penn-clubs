import Fuse from 'fuse.js'
import { ReactElement, useEffect, useState } from 'react'
import { Options, StylesConfig } from 'react-select'
import Select from 'react-select/async'
import styled from 'styled-components'

import {
  BORDER,
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  FOCUS_GRAY,
  MEDIUM_GRAY,
  TAG_BACKGROUND_COLOR_MAP,
  TAG_TEXT_COLOR_MAP,
  WHITE,
} from '../constants/colors'
import { MD, mediaMaxWidth } from '../constants/measurements'
import { Icon, Tag } from './common'

const SearchWrapper = styled.div`
  margin-bottom: 30px;
  overflow: visible;

  ${mediaMaxWidth(MD)} {
    width: 100%;
    margin: 0;
    padding-bottom: 16px;
    border-bottom: 1px solid ${BORDER};
    background: ${WHITE};
  }
`

const SubLabel = styled.div`
  font-size: 0.9em;
  color: ${CLUBS_GREY_LIGHT};

  .tag & {
    display: none;
  }
`

const ColorPreview = styled.div<{ $color: string }>`
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: #${({ color }) => color};
  border: 1px solid black;
  border-radius: 3px;
  margin-right: 5px;
  vertical-align: middle;
`

const SearchIcon = styled(Icon)`
  cursor: pointer;
  color: ${MEDIUM_GRAY};
  opacity: 0.5;
  margin-right: 6px !important;

  ${mediaMaxWidth(MD)} {
    right: 24px;
  }
`

export type FuseTag = {
  value: number | string
  label: string | ReactElement<any>
  text?: string
  count?: number
  color?: string
  name?: string
  description?: string
}

type SearchOption = { label: string; options: FuseTag[] }

type SearchProps = {
  selected: FuseTag[]
  searchTags: (query: string) => Promise<SearchOption[]>
  recommendedTags: SearchOption[]
  updateTag: (tag: FuseTag, name: string) => void
  clearTags: () => void
  name: string
  param: string
}

const Search = ({
  param,
  name,
  selected = [],
  searchTags,
  recommendedTags,
  updateTag,
  clearTags,
}: SearchProps): ReactElement<any> => {
  // Custom styles for the react-select
  const styles: StylesConfig<FuseTag, true> = {
    control: ({ background, ...base }, { isFocused }) => {
      const isEmphasized = isFocused
      return {
        ...base,
        border: `1px solid ${BORDER}`,
        background: isEmphasized ? FOCUS_GRAY : background,
        boxShadow: 'none',
        minHeight: '42px',
        alignItems: 'center',
        '&:hover': {
          background: FOCUS_GRAY,
        },
      }
    },
    valueContainer: (base) => ({
      ...base,
      alignItems: 'center',
      padding: '2px',
    }),
    multiValue: (base) => ({
      ...base,
      alignItems: 'center',
    }),
    option: ({ background, ...base }, { isFocused, isSelected }) => {
      const isEmphasized = isFocused || isSelected
      return {
        ...base,
        background: isEmphasized ? FOCUS_GRAY : background,
        color: CLUBS_GREY,
      }
    },
    placeholder: (base) => {
      // darker placeholder text color to meet AA accessibility guidelines
      return { ...base, color: '#757575' }
    },
  }

  // Overriding specific components of the react-select
  const components = {
    IndicatorSeparator: () => null,
    DropdownIndicator: () => <SearchIcon name="tag" />,
    MultiValueContainer: ({ data }) => {
      const raw = data?.color as string | undefined
      const tagName = data?.name ?? param
      const background = raw
        ? raw.startsWith('#')
          ? raw
          : `#${raw}`
        : tagName
          ? TAG_BACKGROUND_COLOR_MAP[tagName]
          : undefined
      const text = tagName ? TAG_TEXT_COLOR_MAP[tagName] : undefined

      const handleRemove = (e) => {
        e.preventDefault()
        e.stopPropagation()
        updateTag(data, name)
      }

      return (
        <Tag
          color={background}
          foregroundColor={text}
          className="tag is-rounded"
          style={{
            margin: 3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3em',
          }}
        >
          <span>{data.label}</span>
          <button className="delete is-small" onClick={handleRemove} />
        </Tag>
      )
    },
    MultiValueLabel: () => null,
    MultiValueRemove: () => null,
  }
  const selectId = `club-search-${name.toLowerCase()}`

  return (
    <>
      <label className="is-sr-only" htmlFor={`react-select-${selectId}-input`}>
        select {name} to filter by
      </label>
      <Select
        instanceId={selectId}
        isMulti
        cacheOptions
        styles={styles}
        components={components}
        loadOptions={searchTags}
        defaultOptions={recommendedTags}
        value={selected}
        backspaceRemovesValue
        onChange={(value: Options<FuseTag>, selectEvent): void => {
          const { action } = selectEvent
          if (action === 'select-option' || action === 'pop-value') {
            const currentSet = new Set(selected.map(({ value }) => value))
            const newSet = new Set(value.map(({ value }) => value))
            selected
              .filter(({ value }) => !newSet.has(value))
              .forEach((val) => updateTag(val, name))
            value
              .filter(({ value }) => !currentSet.has(value))
              .forEach((val) => updateTag(val, name))
          } else if (action === 'clear') {
            clearTags()
          }
        }}
        placeholder={`Search for ${name.toLowerCase()}`}
      />
    </>
  )
}

const selectInitial = (name: string, tags: FuseTag[] = []) => {
  return [
    {
      label: `All ${name.toLowerCase()}`,
      options: tags,
    },
  ]
}

type FilterProps = {
  param: string
  name: string
  tags: FuseTag[]
  updateTag: (tag: FuseTag, name: string) => void
  selected: FuseTag[]
  clearTags: () => void
}

const Filter = ({
  param,
  name,
  tags,
  updateTag,
  clearTags,
  selected,
}: FilterProps): ReactElement<any> => {
  const filter = new Set()
  selected.forEach(({ value }) => filter.add(value))

  // add count annotation to label
  tags = tags
    .filter(({ value }) => !filter.has(value))
    .map(({ label, count, color, description, ...tag }) => ({
      ...tag,
      text: label as string,
      label: (
        <>
          {color != null && <ColorPreview $color={color} />}
          {`${label}${count != null ? ` (${count})` : ''}`}
          {!!description && <SubLabel>{description}</SubLabel>}
        </>
      ),
    }))

  const fuseOptions = {
    keys: ['text'],
    tokenize: true,
    findAllMatches: true,
    shouldSort: true,
    minMatchCharLength: 2,
    threshold: 0.2,
  }
  const fuse = new Fuse<FuseTag>(tags, fuseOptions)

  const [recommendedTags, setRecommendedTags] = useState(
    selectInitial(name, tags),
  )
  const searchTags = async (query: string) => [
    {
      label:
        query.length > 0
          ? `Matched ${name.toLowerCase()}`
          : `All ${name.toLowerCase()}`,
      options: fuse.search(query).map((result) => result.item),
    },
  ]

  useEffect(() => {
    setRecommendedTags(selectInitial(name, tags))
  }, [selected])

  return (
    <>
      <SearchWrapper>
        <Search
          param={param}
          name={name}
          selected={selected}
          searchTags={searchTags}
          recommendedTags={recommendedTags}
          updateTag={updateTag}
          clearTags={clearTags}
        />
      </SearchWrapper>
    </>
  )
}

export default Filter
