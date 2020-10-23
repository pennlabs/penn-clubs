import { LoadScript } from '@react-google-maps/api'
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url'
import { ReactElement, useEffect, useState } from 'react'
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
}: AddressProps): ReactElement => {
  const {
    suggestions: { data },
    setValue,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 39.952104, lng: () => -75.193739 },
      radius: 4 * 1000,
    },
  })

  const [searchInput, setSearchInput] = useState<string>('')

  const handleChange = (newValue) => {
    if (newValue) {
      changeAddress(newValue.value)
      setValue(newValue.value)
    } else {
      changeAddress('')
    }
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
      value={addressValue ? { label: addressValue, value: addressValue } : null}
      onInputChange={(newVal) => {
        setSearchInput(newVal)
        setValue(newVal)
      }}
      onChange={handleChange}
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
}: AddressProps): ReactElement => {
  const apiKey: string =
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ??
    'AIzaSyDHF4MnEo8LwlB3ERDttQni0JcoBu34w1k'

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
