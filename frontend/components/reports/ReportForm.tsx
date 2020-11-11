import { Field, Form, Formik } from 'formik'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { Flex, Icon, Text } from '../../components/common'
import { Report } from '../../types'
import { API_BASE_URL } from '../../utils'
import { CheckboxField, TextField } from '../FormComponents'

const ReportContainer = styled.div`
  margin: 15px auto;
  padding: 15px;
  max-width: 800px;
`

type Props = {
  fields: { [key: string]: string[] }
  generateCheckboxGroup: (key: string, fields: string[]) => ReactElement
  query: { fields: string[] }
  initial?: Report
  onSubmit: () => void
}

const ReportForm = ({
  fields,
  generateCheckboxGroup,
  query,
  onSubmit,
  initial,
}: Props): ReactElement => {
  const handleGenerateReport = (data: {
    name: string
    description: string
    public: boolean
  }): void => {
    const params = new URLSearchParams({
      name: data.name ?? '',
      desc: data.description ?? '',
      public: data.public?.toString() ?? 'false',
    }).toString()

    window.open(
      `${API_BASE_URL}/clubs/?format=xlsx&${params}&fields=${encodeURIComponent(
        query.fields.join(','),
      )}`,
      '_blank',
    )
    onSubmit()
  }

  return (
    <ReportContainer>
      <Formik
        initialValues={initial ?? {}}
        onSubmit={handleGenerateReport}
        enableReinitialize
      >
        <Form>
          <div className="box">
            <h3 className="title is-4">Report Details</h3>
            <Text>
              All report detail fields are optional. If you do not specify a
              report name, a temporary report will be generated and you will not
              be able to rerun the report.
            </Text>
            <div>
              <Field
                name="name"
                as={TextField}
                disabled={!!initial?.name}
                helpText="This will be shown in the table view on the list of reports."
              />
              <Field
                name="description"
                as={TextField}
                type="textarea"
                helpText="Use this field to note down additional information about this generated report."
              />
              <Field
                name="public"
                as={CheckboxField}
                label="Show this report to other users that can generate reports."
              />
            </div>
          </div>
          <div className="box">
            <h3 className="title is-4">Included Fields</h3>
            <Text>
              Select the fields you want to include below as columns in the
              generated spreadsheet file.
            </Text>
            <div>
              {fields ? (
                <Flex>
                  {Object.keys(fields)
                    .sort()
                    .map((group) =>
                      generateCheckboxGroup(group, fields[group]),
                    )}
                </Flex>
              ) : null}
            </div>
          </div>
          <button className="button is-info" type="submit">
            <Icon name="paperclip" alt="report" />
            Generate Report
          </button>
        </Form>
      </Formik>
    </ReportContainer>
  )
}

export default ReportForm
