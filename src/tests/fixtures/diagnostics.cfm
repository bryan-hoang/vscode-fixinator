<cfquery name="news">
	SELECT * FROM news
	WHERE id = #url.id#
</cfquery>
