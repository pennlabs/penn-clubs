import { LoadScript } from '@react-google-maps/api'
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url'
import { ReactElement, useState } from 'react'
import CreatableSelect from 'react-select/creatable'
import usePlacesAutocomplete from 'use-places-autocomplete'

import { BORDER, CLUBS_GREY, FOCUS_GRAY } from '../../constants/colors'

const styles = {
  control: ({ background, ...base }) => {
    return {
      ...base,
      border: `1px solid ${BORDER}`,
      boxShadow: 'none',
    }
  },
  option: ({ background, ...base }, { isFocused, isSelected }) => {
    const isEmphasized = isFocused || isSelected
    return {
      ...base,
      background: isEmphasized ? FOCUS_GRAY : background,
      color: CLUBS_GREY,
    }
  },
}

type AddressProps = {
  addressValue: string
  changeAddress: (state: string) => void
}

const AddressTypeaheadField = ({
  changeAddress,
  addressValue,
}: AddressProps): ReactElement<any> => {
  const {
    suggestions: { data },
    setValue,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 39.952104, lng: () => -75.193739 } as any,
      radius: 4 * 1000,
      // Coordinates are for the university of Pennsylvania. This prioritizes the suggestions which
      // are within a 4Km radius.
    },
  })

  const [searchInput, setSearchInput] = useState<string>('')

  const handleValueChange = (newValue) => {
    if (newValue) {
      changeAddress(newValue.value)
      setValue(newValue.value)
    } else {
      changeAddress('')
    }
  }

  const handleSearchChange = (newValue) => {
    setSearchInput(newValue)
    setValue(newValue)
  }

  const components = {
    IndicatorSeparator: () => null,
    DropdownIndicator: () => null,
  }

  return (
    <CreatableSelect
      isClearable
      components={components}
      styles={styles}
      inputValue={searchInput}
      onInputChange={handleSearchChange}
      value={addressValue ? { label: addressValue, value: addressValue } : null}
      onChange={handleValueChange}
      placeholder=""
      allowCreateWhileLoading={false}
      createOptionPosition="first"
      formatCreateLabel={(inputValue) => inputValue}
      options={data.map((suggestion) => {
        return { value: suggestion.description, label: suggestion.description }
      })}
    />
  )
}

const LIBRARIES: Libraries = ['places']

const AddressField = ({
  changeAddress,
  addressValue,
}: AddressProps): ReactElement<any> => {
  const apiKey: string = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? ''

  if (apiKey.length <= 0) {
    return (
      <input
        className="input"
        value={addressValue}
        onChange={(e) => changeAddress(e.target.value)}
      />
    )
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={LIBRARIES}>
      <AddressTypeaheadField
        changeAddress={changeAddress}
        addressValue={addressValue}
      />
    </LoadScript>
  )
}

export default AddressField
