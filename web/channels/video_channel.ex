defmodule Rumbl.VideoChannel do
  use Rumbl.Web, :channel

  def join("videos:" <> video_id, _params, socket) do
    video = Repo.get!(Rumbl.Video, video_id)
    annotations = Repo.all(
      from a in assoc(video, :annotations),
      order_by: [desc: a.at],
      limit: 200,
      preload: [:user]
    )
    response = %{
      annotations: Phoenix.View.render_many(
        annotations, Rumbl.AnnotationView, "annotation.json"
      )
    }
    {:ok, response, assign(socket, :video_id, video_id)}
  end

  def handle_in("new_annotation", params, socket) do
    user = socket.assigns.current_user
    video_id = String.to_integer(socket.assigns.video_id)

    changeset = user
    |> build(:annotations, video_id: video_id)
    |> Rumbl.Annotation.changeset(params)

    case Repo.insert(changeset) do
      {:ok, annotation} ->
        broadcast_annotation(socket, annotation)
        Task.start_link(fn -> compute_additional_info(socket, annotation) end)
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset}}, socket}
    end
  end

  defp broadcast_annotation(socket, annotation) do
    annotation = Repo.preload(annotation, :user)
    rendered_annotation = Phoenix.View.render(Rumbl.AnnotationView,
                                              "annotation.json",
                                              %{annotation: annotation})

    broadcast! socket, "new_annotation", rendered_annotation
  end

  defp compute_additional_info(socket, annotation) do
    for result <- Rumbl.InfoSys.compute(annotation.body, limit: 1) do
      attrs = %{url: result.url, body: result.text, at: annotation.at}
      info_changeset = result.backend
      |> build(:annotations, video_id: annotation.video_id)
      |> Rumbl.Annotation.changeset(attrs)

      case Rumbl.Repo.insert(info_changeset) do
        {:ok, info_annotation} ->
          broadcast_annotation(socket, info_annotation)
        {:error, _changeset} -> :ignore
      end
    end
  end
end
