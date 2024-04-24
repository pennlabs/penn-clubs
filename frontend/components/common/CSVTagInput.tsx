import React from 'react'
import CreatableSelect from 'react-select/creatable'

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
}

const CSVTagInput: React.FC<CSVTagInputProps> = ({ onChange, placeholder }) => {
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
      noOptionsMessage={() => null}
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
