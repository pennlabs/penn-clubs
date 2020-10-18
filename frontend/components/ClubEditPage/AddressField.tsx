import { ReactElement, useState, useEffect } from 'react'
import {useLoadScript} from "@react-google-maps/api"
import usePlacesAutocomplete from "use-places-autocomplete"
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url'
import Autosuggest from "react-autosuggest"


type addressProps = React.PropsWithChildren<{
    addressValue : string,
    changeAddress : (state: any) => void,
    selectAddress : () => void
  }>

 const AddressField =  ({
    changeAddress, addressValue}: addressProps):  ReactElement => {
    const apiKey : string = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
    const [libraries, changeLibraries] = useState<Libraries> (["places"]);
    
    const {isLoaded} = useLoadScript({
        googleMapsApiKey : apiKey,
        libraries
    })

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
      } = usePlacesAutocomplete({
        requestOptions: {
        },
      });

      useEffect (()=>{
       if (addressValue) setValue(addressValue);
      },[])

      
      const handleChange = (e, {newValue}) => {
        setValue(newValue)
        changeAddress (newValue);
      }

      const getSuggestionValue = suggestion => suggestion.description;

      const renderSuggestion = suggestion => {
       return ( <div className = "input">
          {suggestion.description}
        </div>);
      }

      const inputProps = {
        placeholder: '',
        value,
        className: "input",
        onChange: handleChange
      };
    if (!isLoaded && ready) return <> </>
    else 
        return(
        <>
        <div > 
         <Autosuggest
        suggestions={data}
        onSuggestionsFetchRequested={()=>{}}
        onSuggestionsClearRequested={()=>{}}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
      </ div>
        </>)}

    export default AddressField;
