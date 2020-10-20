import { LoadScript } from '@react-google-maps/api'
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url'
import { ReactElement, useEffect } from 'react'
import CreatbleSelect from 'react-select/creatable'
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
  changeAddress: (state: any) => void
}

const AddressTypeaheadField = ({
  changeAddress,
  addressValue,
}: AddressProps): ReactElement => {
  const {
    value,
    suggestions: { data },
    setValue,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 39.952104, lng: () => -75.193739 },
      radius: 4 * 1000,
    },
  })

  useEffect(() => {
    if (addressValue.length > 0) setValue(addressValue)
  }, [])

  const handleChange = (newValue) => {
    setValue(newValue)
    if (newValue) changeAddress(newValue.value)
  }

  const components = {
    IndicatorSeparator: () => null,
    DropdownIndicator: () => null,
  }

  return (
    <CreatbleSelect
      isClearable
      components={components}
      styles={styles}
      value={value}
      onInputChange={(newVal) => {
        if (newVal.length > 0) setValue(newVal)
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
