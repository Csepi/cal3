# Documentation Assets

Store screenshots, diagrams, GIFs, and downloadable assets in this folder.

## Recommended Structure

- `docs/assets/getting-started/`
- `docs/assets/user-guide/`
- `docs/assets/api/`

## How To Reference Images

From a markdown page inside `docs/`, use a relative path:

```md
![Create event modal](../../assets/user-guide/create-event-modal.png)
```

If you prefer a public static path, you can also place images in `docs-portal/static/img/` and reference them like this:

```md
![Create event modal](/img/create-event-modal.png)
```
