import { renderToString } from 'react-dom/server'
import React from 'react'

export function render() {
  return renderToString(
    React.createElement('div', {
      'data-surf-placeholder': true,
      style: {
        minHeight: '100vh',
        background: '#ffffff',
      }
    })
  )
}
