# SHARED

shared/
├── http/
│ ├── interceptors/
│ │ └── trx-id.interceptor.ts
│ ├── filters/
│ │ ├── all-exception.filter.ts
│ │ └── rate-limiter.filter.ts
│ └── index.ts
│
├── database/
│ └── base.repository.ts
│
├── helpers/
│ ├── response.helper.ts
│ ├── trx-id.helper.ts
│ └── string.helper.ts
│
├── index.ts
└── tests/

cd src/common
git submodule add <repo-url> shared
example: git submodule add https://github.com/panjiforlak/iti-shared.git src/common/shared

#check status sub module
git submodule status

#pull klo belum pernah
git submodule update --init --recursive

#pull
git pull --recurse-submodules
git submodule update --remote

