<script lang="ts">
  import Modal from "./Modal.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof Modal>;

  let { ...props }: Props = $props();
</script>

<Modal {...props} />
