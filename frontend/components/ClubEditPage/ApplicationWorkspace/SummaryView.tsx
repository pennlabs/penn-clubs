import { ReactElement, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { CLUBS_BLUE, CLUBS_GREY, MD, mediaMaxWidth } from '~/constants'
import {
  ApplicationQuestion,
  ApplicationQuestionType,
  ApplicationResponse,
  ApplicationStatusType,
} from '~/types'

import {
  answerableQuestions,
  answerText,
  Muted,
  Panel,
  Submission,
} from './shared'

// categorical slots, validated for color vision deficiency on white; every
// slice is also labeled in its legend, so color never carries meaning alone
const SLICE_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
]
const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
`
const grow = keyframes`
  from { transform: scaleX(0); }
`
const draw = keyframes`
  from { stroke-dasharray: 0 ${CIRCUMFERENCE}; }
`
const fadeIn = keyframes`
  from { opacity: 0; }
`

// cards float in one after another, unless the reader prefers less motion
const Card = styled(Panel)<{ $order: number }>`
  @media (prefers-reduced-motion: no-preference) {
    animation: ${rise} 0.45s ease both;
    animation-delay: ${({ $order }) => Math.min($order, 8) * 60}ms;
  }

  h4 {
    font-weight: 600;
    color: ${CLUBS_GREY};
  }
`

const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  ${mediaMaxWidth(MD)} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${Card} {
    margin: 0;
    padding: 14px 18px;
  }

  .value {
    font-size: 2rem;
    font-weight: 600;
    color: ${CLUBS_GREY};
    font-variant-numeric: tabular-nums;
  }
`

const BarRow = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 30%) 1fr;
  gap: 12px;
  align-items: center;
  padding: 5px 0;
  color: ${CLUBS_GREY};

  .track {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bar {
    height: 16px;
    border-radius: 0 4px 4px 0;
    background: ${CLUBS_BLUE};
    transform-origin: left;
    transition: opacity 0.2s;
  }

  &:hover .bar {
    opacity: 0.8;
  }

  @media (prefers-reduced-motion: no-preference) {
    .bar {
      animation: ${grow} 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .count {
      animation: ${fadeIn} 0.4s ease both;
      animation-delay: 0.6s;
    }
  }
`

const DonutLayout = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  margin-top: 12px;

  svg {
    width: 180px;
    height: 180px;
    flex: none;
  }

  circle {
    transition:
      opacity 0.2s,
      stroke-width 0.2s;
  }

  @media (prefers-reduced-motion: no-preference) {
    circle {
      animation: ${draw} linear both;
    }
  }

  ul {
    flex: 0 1 360px;
    min-width: 200px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
    cursor: default;
    transition: opacity 0.2s;
  }

  .swatch {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .label {
    flex: 1;
    color: ${CLUBS_GREY};
  }
`

const AnswerList = styled.ul`
  max-height: 260px;
  overflow-y: auto;
  margin-top: 12px;

  li {
    background: #f7f7f8;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 6px;
    white-space: pre-wrap;
  }
`

// counts from 0 up to the target when it first shows
function useCountUp(target: number): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 700, 1)
      setValue(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return value
}

const CountTile = ({
  label,
  value,
  order,
}: {
  label: string
  value: number
  order: number
}): ReactElement => (
  <Card $order={order}>
    <Muted>{label}</Muted>
    <div className="value">{useCountUp(value)}</div>
  </Card>
)

type Slice = { label: string; count: number }

const percentOf = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0

// one bar per option, labeled with its count and share of responses
const BarList = ({
  items,
  total,
}: {
  items: Slice[]
  total: number
}): ReactElement => (
  <div className="mt-3">
    {items.map(({ label, count }, index) => {
      const percent = percentOf(count, total)
      return (
        <BarRow key={label} title={`${label}: ${count} (${percent}%)`}>
          <span>{label}</span>
          <div className="track">
            {count > 0 && (
              <div
                className="bar"
                style={{
                  width: `${Math.max(percent * 0.85, 1)}%`,
                  animationDelay: `${index * 70}ms`,
                }}
              />
            )}
            <Muted className="count">
              {count} ({percent}%)
            </Muted>
          </div>
        </BarRow>
      )
    })}
  </div>
)

// a donut that sweeps in slice by slice, like a Google Forms pie chart
const Donut = ({
  items,
  total,
}: {
  items: Slice[]
  total: number
}): ReactElement => {
  const [active, setActive] = useState<number | null>(null)
  const shown = items.filter(({ count }) => count > 0).length
  let offset = 0

  return (
    <DonutLayout onMouseLeave={() => setActive(null)}>
      <svg viewBox="0 0 200 200" role="img" aria-label="Answers by option">
        {items.map(({ label, count }, index) => {
          if (count === 0) {
            return null
          }
          const length = (count / total) * CIRCUMFERENCE
          const start = offset
          offset += length
          return (
            <circle
              key={label}
              cx={100}
              cy={100}
              r={RADIUS}
              fill="none"
              stroke={SLICE_COLORS[index]}
              strokeWidth={active === index ? 36 : 30}
              // leave a 2px gap between slices
              strokeDasharray={`${Math.max(length - (shown > 1 ? 2 : 0), 0)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-start}
              transform="rotate(-90 100 100)"
              opacity={active === null || active === index ? 1 : 0.35}
              style={{
                animationDuration: `${Math.max((length / CIRCUMFERENCE) * 0.8, 0.05)}s`,
                animationDelay: `${(start / CIRCUMFERENCE) * 0.8}s`,
              }}
              onMouseEnter={() => setActive(index)}
            >
              <title>{`${label}: ${count} (${percentOf(count, total)}%)`}</title>
            </circle>
          )
        })}
        <text
          x={100}
          y={98}
          textAnchor="middle"
          fontSize={30}
          fontWeight={600}
          fill={CLUBS_GREY}
        >
          {total}
        </text>
        <text x={100} y={120} textAnchor="middle" fontSize={13} fill="#737373">
          responses
        </text>
      </svg>
      <ul>
        {items.map(({ label, count }, index) => (
          <li
            key={label}
            style={{
              opacity: active === null || active === index ? 1 : 0.45,
            }}
            onMouseEnter={() => setActive(index)}
          >
            <span
              className="swatch"
              style={{ background: SLICE_COLORS[index] }}
            />
            <span className="label">{label}</span>
            <Muted>
              {count} ({percentOf(count, total)}%)
            </Muted>
          </li>
        ))}
      </ul>
    </DonutLayout>
  )
}

const optionCounts = (
  question: ApplicationQuestion,
  answers: Array<ApplicationResponse | undefined>,
): Slice[] =>
  question.multiple_choice.map(({ value }) => ({
    label: value,
    count: answers.filter(
      (response) =>
        response?.multiple_choice?.value === value ||
        response?.selected_choices?.some((choice) => choice.value === value),
    ).length,
  }))

/**
 * Totals by decision, then one card per question: a pie for single-choice
 * questions with a few options, bars for checkboxes and longer lists, and the
 * written answers for text questions.
 */
export default function SummaryView({
  submissions,
  questions,
  committees,
}: {
  submissions: Submission[]
  questions: ApplicationQuestion[]
  committees: string[]
}): ReactElement {
  const count = (matches: (submission: Submission) => boolean) =>
    submissions.filter(matches).length

  return (
    <>
      <Tiles>
        {(
          [
            ['Responses', submissions.length],
            [
              'Pending',
              count(({ status }) => status === ApplicationStatusType.Pending),
            ],
            [
              'Accepted',
              count(({ status }) => status === ApplicationStatusType.Accepted),
            ],
            [
              'Rejected',
              count(
                ({ status }) =>
                  status === ApplicationStatusType.RejectedWritten ||
                  status === ApplicationStatusType.RejectedInterview,
              ),
            ],
          ] as const
        ).map(([label, value], index) => (
          <CountTile key={label} label={label} value={value} order={index} />
        ))}
      </Tiles>

      {committees.length > 0 && (
        <Card $order={4}>
          <h4>By committee</h4>
          <Muted>{submissions.length} responses</Muted>
          <BarList
            total={submissions.length}
            items={committees.map((name) => ({
              label: name,
              count: count(({ committee }) => committee?.name === name),
            }))}
          />
        </Card>
      )}

      {answerableQuestions(questions).map((question, index) => {
        const answers = submissions
          .map((submission) =>
            submission.responses.find(
              (response) => response.question.id === question.id,
            ),
          )
          .filter((response) => answerText(response) !== '')
        const options = question.multiple_choice.length
        const isPie =
          question.question_type === ApplicationQuestionType.MultipleChoice &&
          options >= 3 &&
          options <= SLICE_COLORS.length
        const isBars =
          !isPie &&
          (question.question_type === ApplicationQuestionType.MultipleChoice ||
            question.question_type === ApplicationQuestionType.Checkbox)

        return (
          <Card key={question.id} $order={index + 5}>
            <h4>{question.prompt}</h4>
            <Muted>
              {answers.length} response{answers.length === 1 ? '' : 's'}
              {question.question_type === ApplicationQuestionType.Checkbox &&
                ' · applicants could pick more than one'}
            </Muted>
            {answers.length === 0 ? (
              <p className="mt-2">
                <Muted>No answers yet</Muted>
              </p>
            ) : isPie ? (
              <Donut
                total={answers.length}
                items={optionCounts(question, answers)}
              />
            ) : isBars ? (
              <BarList
                total={answers.length}
                items={optionCounts(question, answers)}
              />
            ) : (
              <AnswerList>
                {answers.map((response, i) => (
                  <li key={i}>{answerText(response)}</li>
                ))}
              </AnswerList>
            )}
          </Card>
        )
      })}
    </>
  )
}
