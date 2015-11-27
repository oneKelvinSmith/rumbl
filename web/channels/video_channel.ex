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
        broadcast! socket, "new_annotation", %{
          user: Rumbl.UserView.render("user.json", %{user: user}),
          body: annotation.body,
          at: annotation.at
        }
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset}}, socket}
    end
  end
end
