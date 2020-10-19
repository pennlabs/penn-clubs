import { LoadScript } from '@react-google-maps/api'
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url'
import { ReactElement, useEffect } from 'react'
import Autosuggest from 'react-autosuggest'
import usePlacesAutocomplete from 'use-places-autocomplete'

type AddressProps = {
  addressValue: string
  changeAddress: (state: any) => void
}

const AddressTypeaheadField = ({
  changeAddress,
  addressValue,
}: AddressProps): ReactElement => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {},
  })

  useEffect(() => {
    if (addressValue) setValue(addressValue)
  }, [])

  const handleChange = (e, { newValue }) => {
    setValue(newValue)
    changeAddress(newValue)
  }

  const getSuggestionValue = (suggestion) => suggestion.description

  const renderSuggestion = (suggestion) => {
    return <div className="input">{suggestion.description}</div>
  }

  const inputProps = {
    placeholder: '',
    value,
    className: 'input',
    onChange: handleChange,
  }
  return (
    <Autosuggest
      suggestions={data}
      onSuggestionsFetchRequested={() => {}}
      onSuggestionsClearRequested={() => {}}
      getSuggestionValue={getSuggestionValue}
      renderSuggestion={renderSuggestion}
      inputProps={inputProps}
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
