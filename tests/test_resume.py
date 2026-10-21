def test_view_resume(client, api_base):
    res = client.get(f"{api_base}/resume/view")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "inline" in res.headers["content-disposition"]
    assert res.content[:5] == b"%PDF-"


def test_download_resume(client, api_base):
    res = client.get(f"{api_base}/resume/download")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "attachment" in res.headers["content-disposition"]
    assert res.content[:5] == b"%PDF-"
