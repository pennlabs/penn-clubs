import { ReactElement } from 'react'

type BaseCardProps = React.PropsWithChildren<{
  title: string
}>

/**
 * All cards on the club edit page are wrapped in this base card.
 */
export default function BaseCard({
  children,
  title,
}: BaseCardProps): ReactElement<any> {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <p className="card-header-title">{title}</p>
      </div>
      <div className="card-content">{children}</div>
    </div>
  )
}
