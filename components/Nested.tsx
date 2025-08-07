import React, { memo, type PropsWithChildren } from "react"

interface Props {
  components: Array<React.ComponentType | (({ children }) => JSX.Element)>
}

export const Nested = memo(function NestedComponents(props: PropsWithChildren<Props>) {
  const { components, children } = props
  return (
    <>
      {components.reduceRight((Prev, Curr) => {
        return <Curr>{Prev}</Curr>
      }, children)
      }
    </>
  )
})