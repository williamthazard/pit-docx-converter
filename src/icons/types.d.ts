// TypeScript declaration for the <ion-icon> web component in TSX.
import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          name: string
          size?: 'small' | 'large'
        },
        HTMLElement
      >
    }
  }
}
