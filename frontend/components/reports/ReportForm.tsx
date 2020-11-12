import { Field, Form, Formik } from 'formik'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { Flex, Icon, Text } from '../../components/common'
import { Badge, Report } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_PLURAL } from '../../utils/branding'
import { CheckboxField, SelectField, TextField } from '../FormComponents'

const ReportContainer = styled.div`
  margin: 15px auto;
  padding: 15px;
  max-width: 800px;
`

const ReportBox = ({
  children,
  title,
}: React.PropsWithChildren<{ title: ReactElement | string }>): ReactElement => {
  return (
    <div className="box">
      <h3 className="title is-4">{title}</h3>
      {children}
    </div>
  )
}

type Props = {
  fields: { [key: string]: string[] }
  generateCheckboxGroup: (key: string, fields: string[]) => ReactElement
  query: { fields: string[] }
  initial?: Report
  badges: Badge[]
  onSubmit: (report: Report) => void
}

const ReportForm = ({
  fields,
  generateCheckboxGroup,
  query,
  onSubmit,
  initial,
  badges,
}: Props): ReactElement => {
  const serializeParameter = (param): string | undefined => {
    if (typeof param === 'string') {
      return param
    }
    if (typeof param === 'boolean') {
      return param.toString()
    }
    if (Array.isArray(param)) {
      if (param.length <= 0) {
        return undefined
      }
      return param
        .map((item) => {
          return typeof item === 'string' ? item : item.id
        })
        .join(',')
    }
    return undefined
  }

  const handleGenerateReport = async (
    data: Partial<{
      name: string
      description: string
      public: boolean
      badges__in: { id: number }[]
    }>,
  ): Promise<void> => {
    const parameters: { [key: string]: string | undefined } = {
      format: 'xlsx',
      fields: query.fields.join(','),
      badges__in: serializeParameter(data.badges__in),
    }

    Object.keys(parameters).forEach(
      (key) => parameters[key] === undefined && delete parameters[key],
    )

    const body = {
      name: data.name ?? 'Last Report',
      description: data.description ?? '',
      public: serializeParameter(data.public ?? false),
      parameters: JSON.stringify(parameters),
    }

    const resp = await doApiRequest('/reports/', { method: 'POST', body })
    const report = await resp.json()
    onSubmit(report)
  }

  return (
    <ReportContainer>
      <Formik
        initialValues={
          initial != null
            ? { ...JSON.parse(initial.parameters), ...initial }
            : {}
        }
        onSubmit={handleGenerateReport}
        enableReinitialize
      >
        <Form>
          <ReportBox title="Report Details">
            <Text>
              All report detail fields are optional. If you specify a report
              name that already exists, it will overwrite that report. If you do
              not specify a report name, your report will be saved as "Last
              Report".
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
          </ReportBox>
          <ReportBox title="Filters">
            <Text>
              You can specify filters below to only include specific{' '}
              {OBJECT_NAME_PLURAL} in your report. Any fields you leave blank
              will not be applied as filters.
            </Text>
            <Field
              name="badges__in"
              label="Badges"
              as={SelectField}
              choices={badges}
              valueDeserialize={(value) => {
                if (typeof value === 'string') {
                  return value
                    .trim()
                    .split(',')
                    .filter((tag) => tag.length > 0)
                    .map((tag) => {
                      const id = parseInt(tag)
                      const trueVal = badges.find((oth) => oth.id === id)
                      return trueVal != null
                        ? trueVal
                        : { id, label: 'Unknown' }
                    })
                }
                if (Array.isArray(value)) {
                  return value.map(({ id, name }) => ({ id, label: name }))
                }
                return []
              }}
              isMulti
              helpText={`Select only ${OBJECT_NAME_PLURAL} with all of the specified badges.`}
            />
          </ReportBox>
          <ReportBox title="Included Fields">
            <Text>
              Select the fields you want to include below as columns in the
              generated spreadsheet file.
            </Text>
            {fields ? (
              <Flex>
                {Object.keys(fields)
                  .sort()
                  .map((group) => generateCheckboxGroup(group, fields[group]))}
              </Flex>
            ) : null}
          </ReportBox>
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
