"use client";

type MessageChannelDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  channelId: string;
  channelTitle: string;
};

export default function MessageChannelDeleteForm({
  action,
  channelId,
  channelTitle,
}: MessageChannelDeleteFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete "${channelTitle}" and permanently remove its messages?`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="channelId" value={channelId} />
      <button
        type="submit"
        className="inline-flex items-center rounded-full border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1018]"
      >
        Delete channel
      </button>
    </form>
  );
}
