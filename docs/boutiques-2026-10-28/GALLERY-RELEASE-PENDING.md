# Gallery release prerequisite — resolved

Resolved October 29, 2026 UTC. The owner reported completing cleanup, and a read-only check found 6,594,441,216 free bytes, above the unchanged 6 GiB reserve. The combined website release **62c21d1810428720bef913339a837746932b2c15** is deployed, including the boutique expansion, category reset, phone vendor-gallery repair and one-month phone calendar. The exact [successful receipt](expanded-gallery-deployment-success.json), [49 public checks](expanded-gallery-public-checks.json) and [live gallery review](expanded-gallery-live-checks.json) confirm completion. No further cleanup action is requested here; native publication remains held.

## Earlier blocker and prepared payload

The expanded galleries are committed at `a9bdf8cdfaa5f7a6acb9e8cd98b3cc68880666a3` and fully validated locally. The isolated manifest/bundle are in ignored `.cache/expanded-gallery-release`; its manifest SHA-256 is `f82b508b1b393572a874c463e3ff9074ad17969b6f56950db6d962f23a136df2`.

The fixed gateway accepted this payload, but an exact successful release receipt was not produced. The current live source and exported successful receipt remain `3c74fd44298b0ea85069a0d500d4f14f58ea6d84`. The transient service was collected, so a missing unit with default `Result=success` must not be accepted as release evidence.

The independent disk check found **6,265,036,800 bytes free**, below the helper's required **6,442,450,944 bytes (6 GiB)**. This prevents the reviewed preflight from passing; available memory was 6,395 MiB. No build reserve was lowered, no privileged helper was changed, and no rollback checkout, database or backup was deleted. The audit account's regenerable caches are too small to close the gap, and the deploy user's cache is not accessible through that account.

The owner was asked to run this one-time command in the existing administrator terminal:

```sh
sudo -u deploy -H npm cache clean --force
```

This clears regenerable package downloads rather than application files. The existing shared deploy account will download packages again on future builds. Actual reclaimed space is not yet known. It does not install a cleanup timer or authorize retention deletion.

After the owner reports completion, check aggregate free space. If it meets the reviewed reserve, verify the live base has not changed, confirm the gateway is idle, upload only the already-verified manifest/bundle from the isolated payload folder and invoke the fixed gateway again. If the live base changed, regenerate the bundle against that verified source and review the target. Require the exact target commit in the successful receipt, then run `.cache/expanded-gallery-public.cjs` and live browser gallery/video checks. Update project context and the gallery handoff only after success. Keep native publication held.
