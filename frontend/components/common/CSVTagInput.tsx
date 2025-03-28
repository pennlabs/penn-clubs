import React from 'react'
import CreatableSelect from 'react-select/creatable'

import { CLUBS_RED } from '~/constants'

function splitString(s: string): string[] {
  return s
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(/, +|,| +/)
    .filter((v) => v.length > 0)
}

interface CSVTagInputProps {
  onChange: (newValue: string[]) => void
  placeholder?: string
  invalidTags?: string[]
}

const CSVTagInput: React.FC<CSVTagInputProps> = ({
  onChange,
  placeholder,
  invalidTags,
}) => {
  const [tags, setTags] = React.useState<string[]>([])
  const [input, setInput] = React.useState<string>()

  const handleChange = (newValues: any[]) => {
    const newTags = newValues.map((v) => v.value).flatMap(splitString)
    setTags(newTags)
    onChange(newTags)
  }

  const handleInputChange = (newInput: string) => {
    const input = newInput.trim()
    if ((newInput.endsWith(',') || newInput.endsWith(' ')) && input) {
      const newTags = splitString(input)
      setTags([...tags, ...newTags])
      setInput('')
    } else {
      setInput(newInput)
    }
  }

  React.useEffect(() => {
    onChange(tags)
  }, [tags])

  return (
    <CreatableSelect
      components={
        invalidTags
          ? {
              MultiValue: ({ children, ...props }) => {
                const isInvalid = invalidTags.includes(props.data.value)
                return (
                  <div
                    style={{
                      backgroundColor: isInvalid ? CLUBS_RED : 'inherit',
                      borderRadius: '2px',
                      color: isInvalid ? CLUBS_RED : 'inherit',
                    }}
                  >
                    {children}
                  </div>
                )
              },
            }
          : {}
      }
      noOptionsMessage={() => null}
      isClearable
      isMulti
      placeholder={placeholder}
      onChange={handleChange}
      onInputChange={handleInputChange}
      inputValue={input}
      value={tags.map((tag) => ({ value: tag, label: tag }))}
    />
  )
}

export default CSVTagInput
