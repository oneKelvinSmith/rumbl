defmodule Rumbl.InfoSys.Wolfram do
  import SweetXml
  import Ecto.Query, only: [from: 2]
  alias Rumbl.InfoSys.Result

  def start_link(query, query_ref, owner, limit) do
    Task.start_link(__MODULE__, :fetch, [query, query_ref, owner, limit])
  end

  def fetch(query, query_ref, owner, limit) do
    query
    |> fetch_xml()
    |> xpath(selector())
    |> send_results(query_ref, owner)
  end

  defp selector() do
    ~x"/queryresult/pod[contains(@title, 'Result') or contains(@title, 'Definitions')]/subpod/plaintext/text()"
  end

  defp send_results(nil, query_ref, owner) do
    send(owner, {:results, query_ref, []})
  end
  defp send_results(answer, query_ref, owner) do
    results = [%Result{backend: user(), score: 95, text: to_string(answer)}]
    send(owner, {:results, query_ref, results})
  end

  defp fetch_xml(query) do
    {:ok, {_, _, body}} = :httpc.request(wolfram_url(query))

    to_string(body)
  end

  defp wolfram_url(query) do
    "http://api.wolframalpha.com/v2/query" <>
      "?appid=#{app_id()}" <>
      "&input=#{URI.encode(query)}&format=plaintext"
    |> String.to_char_list()
  end

  defp app_id(), do: Application.get_env(:rumbl, :wolfram)[:app_id]

  defp user() do
    Rumbl.Repo.one!(from u in Rumbl.User, where: u.username == "wolfram")
  end
end
