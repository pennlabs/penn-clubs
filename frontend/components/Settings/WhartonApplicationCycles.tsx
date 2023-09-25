import { Field } from 'formik'
import React, { ReactElement } from 'react'

import { DateTimeField, TextField } from '../FormComponents'
import ModelForm from '../ModelForm'

const fields = (
  <>
    <Field name="name" as={TextField} />
    <Field name="start_date" as={DateTimeField} />
    <Field name="end_date" as={DateTimeField} />
  </>
)

const WhartonApplicationCycles = (): ReactElement => {
  return (
    <>
      <ModelForm
        baseUrl={`/cycles/`}
        noun="Cycle"
        fields={fields}
        tableFields={[
          { name: 'name' },
          { name: 'start_date' },
          { name: 'end_date' },
        ]}
      />
    </>
  )
}

export default WhartonApplicationCycles
