import { Field, Form, Formik } from 'formik'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { Checkbox, CheckboxLabel, Icon, Text } from '../../components/common'
import { CLUBS_GREY } from '../../constants/colors'
import { Badge, Report, Tag } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_PLURAL } from '../../utils/branding'
import { CheckboxField, SelectField, TextField } from '../FormComponents'

const ReportContainer = styled.div`
  margin: 15px auto;
  padding: 15px;
  max-width: 800px;
`

const GroupLabel = styled.h4`
  font-size: 32px;
  color: #626572;

  &:not(:last-child) {
    margin-bottom: 0;
  }
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
  fields: [string, [string, string][]][]
  initial?: Report
  badges: Badge[]
  tags: Tag[]
  onSubmit: (report: Report) => void
}

/**
 * Try to reconcile the JSON format for tags/badges returned by the API and the format that the field is expecting.
 */
export const fixDeserialize =
  (options: { id: number; label?: string; name?: string }[]) =>
  (value): { id: number; label: string }[] => {
    if (typeof value === 'string') {
      return value
        .trim()
        .split(',')
        .filter((tag) => tag.length > 0)
        .map((tag) => {
          const id = parseInt(tag)
          const trueVal = options.find((oth) => oth.id === id)
          if (trueVal != null) {
            trueVal.label = trueVal.label ?? trueVal.name ?? 'Unknown'
          }
          return trueVal != null ? trueVal : { id, label: 'Unknown' }
        }) as { id: number; label: string }[]
    }
    if (Array.isArray(value)) {
      return value.map(({ id, name }) => ({ id, label: name }))
    }
    return []
  }

const ReportForm = ({
  fields,
  onSubmit,
  initial,
  badges,
  tags,
}: Props): ReactElement => {
  const generateCheckboxGroup = (
    groupName: string,
    fields: [string, string][],
    setFieldValue: (field: string, value: string[]) => void,
    initialValues: string[] = [],
  ): ReactElement => {
    const fieldsInGroup = fields.map((field) => field[1])

    return (
      <div className="column" key={groupName}>
        <GroupLabel className="subtitle is-4" style={{ color: CLUBS_GREY }}>
          {groupName}
        </GroupLabel>
        <small>
          <a
            onClick={() =>
              setFieldValue(
                'fields',
                initialValues.concat(
                  fieldsInGroup.filter(
                    (field) => initialValues.indexOf(field) === -1,
                  ),
                ),
              )
            }
          >
            Select All
          </a>{' '}
          -{' '}
          <a
            onClick={() =>
              setFieldValue(
                'fields',
                initialValues.filter(
                  (field) => fieldsInGroup.indexOf(field) === -1,
                ),
              )
            }
          >
            Select None
          </a>
        </small>
        {fields
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([field, encoded], idx) => {
            const fieldId = `fields-${groupName}-${encoded}`
            return (
              <div key={idx}>
                <Field
                  type="checkbox"
                  as={Checkbox}
                  id={fieldId}
                  value={encoded}
                  name="fields"
                />
                {'  '}
                <CheckboxLabel htmlFor={fieldId}>{field}</CheckboxLabel>
              </div>
            )
          })}
      </div>
    )
  }

  const serializeParameter = (
    param: string | boolean | (string | { id: string | number })[],
  ): string | undefined => {
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
        .map((item: string | { id: string | number }): string => {
          return typeof item === 'string' ? item : item.id.toString()
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
      fields: string[]
      badges__in: { id: number }[]
      tags__in: { id: number }[]
    }>,
  ): Promise<void> => {
    const parameters: { [key: string]: string | undefined } = {
      format: 'xlsx',
      fields: data.fields?.join(','),
      badges__in: serializeParameter(data.badges__in ?? []),
      tags__in: serializeParameter(data.tags__in ?? []),
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

  const unpackReportParameters = (report: Report) => {
    const params = JSON.parse(report.parameters)
    params.fields = params.fields?.split(',') ?? []
    return { ...params, ...report }
  }

  return (
    <ReportContainer>
      <Formik
        initialValues={initial != null ? unpackReportParameters(initial) : {}}
        onSubmit={handleGenerateReport}
        enableReinitialize
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form>
            <ReportBox title="Report Details">
              <Text>
                You can use this utility to generate an Excel spreadsheet of{' '}
                {OBJECT_NAME_PLURAL} with certain fields and matching certain
                conditions.
              </Text>
              <Text>
                All report detail fields are optional. If you specify a report
                name that already exists, it will overwrite that report. If you
                do not specify a report name, your report will be saved as "Last
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
                will not be applied as filters. Only {OBJECT_NAME_PLURAL}{' '}
                matching all conditions will be exported in the spreadsheet.
              </Text>
              <Field
                name="tags__in"
                label="Tags"
                as={SelectField}
                choices={tags}
                valueDeserialize={fixDeserialize(tags)}
                isMulti
                helpText={`Select only ${OBJECT_NAME_PLURAL} with all of the specified tags.`}
              />
              <Field
                name="badges__in"
                label="Badges"
                as={SelectField}
                choices={badges}
                valueDeserialize={fixDeserialize(badges)}
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
                <div className="columns">
                  {fields
                    .sort()
                    .map(([a, b]) =>
                      generateCheckboxGroup(a, b, setFieldValue, values.fields),
                    )}
                </div>
              ) : null}
            </ReportBox>
            <button
              className="button is-info"
              type="submit"
              disabled={isSubmitting}
            >
              <Icon name="paperclip" alt="report" />
              Generate Report
            </button>
          </Form>
        )}
      </Formik>
    </ReportContainer>
  )
}

export default ReportForm
