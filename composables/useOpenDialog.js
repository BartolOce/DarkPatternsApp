import { onMounted, watch } from 'vue'

export function useOpenDialog(props, dialogRef, onOpen) {
  onMounted(() => {
    const el = dialogRef.value
    if (props.open && el?.showModal) {
      el.showModal()
      if (onOpen) onOpen()
    }
  })

  watch(
    () => props.open,
    (val) => {
      const el = dialogRef.value
      if (!el) return
      if (val) {
        if (el.showModal && !el.open) el.showModal()
        if (onOpen) onOpen()
      } else {
        if (el.close && el.open) el.close()
      }
    }
  )
}
