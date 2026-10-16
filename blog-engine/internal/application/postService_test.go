package application

import (
	"errors"
	"testing"
	"time"
)

func TestNullable(t *testing.T) {
	if got := nullable[int64](nil); got.Valid {
		t.Errorf("expected nil pointer to be NULL, got %+v", got)
	}

	value := int64(7)
	got := nullable(&value)

	if !got.Valid || got.V != 7 {
		t.Errorf("expected valid 7, got %+v", got)
	}
}

type fakeScanner struct {
	values []any
	err    error
}

func (s fakeScanner) Scan(dest ...any) error {
	if s.err != nil {
		return s.err
	}

	for i, value := range s.values {
		switch d := dest[i].(type) {
		case *int64:
			*d = value.(int64)
		case **int64:
			if value != nil {
				v := value.(int64)
				*d = &v
			}
		case *string:
			*d = value.(string)
		case **string:
			if value != nil {
				v := value.(string)
				*d = &v
			}
		case *time.Time:
			*d = value.(time.Time)
		}
	}

	return nil
}

func TestScanPost_MapsColumnsInOrder(t *testing.T) {
	published := time.Date(2025, 6, 1, 0, 0, 0, 0, time.UTC)
	updated := published.Add(time.Hour)

	post, err := scanPost(fakeScanner{values: []any{
		int64(1), int64(2), int64(3), "Title", "title", "Summary", "# Body", published, updated,
	}})
	if err != nil {
		t.Fatalf("scanPost returned error: %v", err)
	}

	if post.PostID != 1 || post.AuthorID != 2 || post.CategoryID == nil || *post.CategoryID != 3 {
		t.Errorf("unexpected IDs: %+v", post)
	}

	if post.Title != "Title" || post.Slug != "title" || post.Summary == nil || *post.Summary != "Summary" {
		t.Errorf("unexpected text fields: %+v", post)
	}

	if post.BodyMarkdown != "# Body" || !post.DatePublished.Equal(published) || !post.DateUpdated.Equal(updated) {
		t.Errorf("unexpected body or dates: %+v", post)
	}
}

func TestScanPost_ReturnsScanError(t *testing.T) {
	scanErr := errors.New("boom")

	_, err := scanPost(fakeScanner{err: scanErr})
	if !errors.Is(err, scanErr) {
		t.Errorf("expected %v, got %v", scanErr, err)
	}
}

type fakeResult struct {
	affected int64
	err      error
}

func (r fakeResult) LastInsertId() (int64, error) { return 0, nil }
func (r fakeResult) RowsAffected() (int64, error) { return r.affected, r.err }

func TestRequireAffected(t *testing.T) {
	if err := requireAffected(fakeResult{affected: 1}); err != nil {
		t.Errorf("expected nil for one affected row, got %v", err)
	}

	if err := requireAffected(fakeResult{affected: 0}); !errors.Is(err, ErrPostNotFound) {
		t.Errorf("expected ErrPostNotFound for zero rows, got %v", err)
	}

	resultErr := errors.New("boom")
	if err := requireAffected(fakeResult{err: resultErr}); !errors.Is(err, resultErr) {
		t.Errorf("expected %v, got %v", resultErr, err)
	}
}
