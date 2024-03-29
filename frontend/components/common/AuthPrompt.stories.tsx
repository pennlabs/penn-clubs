import { Story } from '@storybook/react'

import AuthPrompt from './AuthPrompt'

export default {
  title: 'Auth Prompt',
  component: AuthPrompt,
}

export const Default: Story<React.ComponentProps<typeof AuthPrompt>> =
  AuthPrompt.bind({})

Default.args = {
  title: undefined,
  children: undefined,
  hasLogin: true,
}
