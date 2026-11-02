import styled from 'styled-components'

import { ADMIN_ACCENT, ADMIN_NAVY } from './adminTheme'

export const AdminPrimary = styled.button`
  appearance: none;
  align-items: center;
  background: ${ADMIN_ACCENT};
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-weight: 600;
  gap: 6px;
  justify-content: center;
  line-height: 1;
  padding: 9px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:hover:not(:disabled) {
    background: #3b45d4;
    color: #fff;
  }
`

export const AdminGhost = styled.button`
  appearance: none;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  justify-content: center;
  line-height: 1;
  padding: 8px 12px;

  &:hover:not(:disabled) {
    background: #f7f8fb;
    color: ${ADMIN_NAVY};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`

export const AdminGhostLink = styled.a`
  appearance: none;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  justify-content: center;
  line-height: 1;
  padding: 8px 12px;
  text-decoration: none;

  &:hover {
    background: #f7f8fb;
    color: ${ADMIN_NAVY};
    text-decoration: none;
  }
`

export const AdminDanger = styled(AdminGhost)`
  border-color: #f0b4b4;
  color: #a32020;

  &:hover:not(:disabled) {
    background: #fde8e8;
    color: #a32020;
  }
`

export const AdminActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 1.25rem;
`
