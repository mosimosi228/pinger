package query

type PaginateQuery struct {
	Page  int `query:"page" default:"1" validate:"omitempty,min=1,max=999"`
	Limit int `query:"limit" default:"100" validate:"omitempty,min=1,max=500"`
}
